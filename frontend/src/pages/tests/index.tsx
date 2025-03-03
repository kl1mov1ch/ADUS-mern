//@ts-nocheck
import React, { useState } from "react";
import {
    useGetTestsQuery,
    useDeleteTestMutation,
    useGetCategoriesAndSubcategoriesForTestQuery,
    useGetAllCategoriesQuery,
    useUpdateTestVisibilityMutation,
    useAssignTestToClassMutation,
    useGetAllClassesQuery,
    useRemoveTestAssignmentMutation
} from "../../app/services/userApi";
import {
    Card,
    Spinner,
    Button,
    Divider,
    CardHeader,
    CardBody,
    CardFooter,
    Input,
    Pagination,
    Select,
    SelectItem,
    Chip,
    Alert,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@nextui-org/react";
import { ErrorMessage } from "../../components/error-message";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { IoIosSearch, IoMdClose } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import { BiTrash } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

export const TestList = () => {
    const { data: tests, error, isLoading, refetch } = useGetTestsQuery();
    const [deleteTest] = useDeleteTestMutation();
    const [updateTestVisibility] = useUpdateTestVisibilityMutation();
    const [assignTestToClass] = useAssignTestToClassMutation();
    const { data: classes = [] } = useGetAllClassesQuery();
    const navigate = useNavigate();

    const user = useSelector((state: RootState) => state.auth.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [removeTestAssignment] = useRemoveTestAssignmentMutation();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const testsPerPage = 5;
    const [showMyTests, setShowMyTests] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState<{ isVisible: boolean; message: string }>({
        isVisible: false,
        message: "",
    });
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTestForAssign, setSelectedTestForAssign] = useState<string | null>(null);
    const [selectedClassesForAssign, setSelectedClassesForAssign] = useState<string[]>([]);
    const [assignAlert, setAssignAlert] = useState<{ isVisible: boolean; message: string }>({
        isVisible: false,
        message: "",
    });

    const testIds = tests?.map((test) => test.id) || [];
    const { data: categoriesForTests } = useGetCategoriesAndSubcategoriesForTestQuery(testIds, {
        skip: testIds.length === 0,
    });
    const { data: allCategories } = useGetAllCategoriesQuery();

    if (isLoading) return <Spinner aria-label="Загружаем тесты и категории..." />;
    if (error) return <ErrorMessage error="Ошибка при загрузке тестов" />;

    const handleAssignTestToClasses = async () => {
        if (selectedTestForAssign && selectedClassesForAssign.length > 0) {
            try {
                await assignTestToClass({
                    testId: selectedTestForAssign,
                    classIds: selectedClassesForAssign,
                }).unwrap();
                setAssignAlert({ isVisible: true, message: "Тест успешно назначен выбранным классам!" });
                setIsAssignModalOpen(false);
                setSelectedClassesForAssign([]);
                refetch();
            } catch (error) {
                console.error("Ошибка при назначении теста:", error);
                setAssignAlert({ isVisible: true, message: "Ошибка при назначении теста." });
            }
        } else {
            setAssignAlert({ isVisible: true, message: "Пожалуйста, выберите тест и хотя бы один класс." });
        }
    };

    const handleCategoryChange = (keys: Iterable<string>) => {
        const selectedKeysArray = Array.from(keys);
        setSelectedCategories(selectedKeysArray);
        setSelectedSubcategories([]);
    };

    const handleToggleVisibility = async (testId: string) => {
        try {
            await updateTestVisibility(testId).unwrap();
            refetch();
        } catch (error) {
            console.error("Ошибка при изменении видимости теста:", error);
        }
    };

    const handleRemoveAssignment = async (testId: string, classId: string) => {
        try {
            await removeTestAssignment({ testId, classId }).unwrap();
            setAssignAlert({ isVisible: true, message: "Назначение успешно удалено!" });
            refetch();
        } catch (error) {
            console.error("Ошибка при удалении назначения:", error);
            setAssignAlert({ isVisible: true, message: "Ошибка при удалении назначения." });
        }
    };

    const handleSubcategoryChange = (subcategoryId: string) => {
        setSelectedSubcategories((prev) =>
          prev.includes(subcategoryId)
            ? prev.filter((id) => id !== subcategoryId)
            : [...prev, subcategoryId]
        );
    };

    const handleRemoveSubcategory = (subcategoryId: string) => {
        setSelectedSubcategories((prev) => prev.filter((id) => id !== subcategoryId));
    };

    const handleDeleteTest = async (testId: string) => {
        try {
            await deleteTest(testId).unwrap();
            setDeleteAlert({ isVisible: true, message: "Тест успешно удален!" });
            refetch();
        } catch (error) {
            setDeleteAlert({ isVisible: true, message: "Ошибка при удалении теста." });
        }
    };

    let filteredTests = tests?.filter((test) =>
      test.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showMyTests) {
        filteredTests = filteredTests?.filter((test) => test.teacherId === user.id);
    }

    if (selectedCategories.length > 0) {
        filteredTests = filteredTests?.filter((test) => {
            const testCategoryData = categoriesForTests?.find((cat) => cat.testId === test.id);
            const testCategoryIds = testCategoryData?.categories?.map((cat) => cat.id) || [];
            return selectedCategories.some((catId) => testCategoryIds.includes(catId));
        });
    }

    if (selectedSubcategories.length > 0) {
        filteredTests = filteredTests?.filter((test) => {
            const testCategoryData = categoriesForTests?.find((cat) => cat.testId === test.id);
            const testSubcategoryIds = testCategoryData?.subcategories?.map((sub) => sub.id) || [];
            return selectedSubcategories.some((subId) => testSubcategoryIds.includes(subId));
        });
    }

    const indexOfLastTest = currentPage * testsPerPage;
    const indexOfFirstTest = indexOfLastTest - testsPerPage;
    const currentTests = filteredTests?.slice(indexOfFirstTest, indexOfLastTest);

    return (
      <div className="test-list flex gap-6">
          {/* Левая колонка: список тестов */}
          <div className="flex-1">
              <div className="mb-6 w-full flex justify-center items-center space-x-4">
                  <Input
                    type="text"
                    placeholder="Поиск по названию теста"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-1/2"
                    startContent={<IoIosSearch />}
                    endContent={
                      searchQuery && (
                        <IoMdClose
                          className="cursor-pointer"
                          onClick={() => setSearchQuery("")}
                        />
                      )
                    }
                  />
              </div>

              {deleteAlert.isVisible && (
                <div
                  className="fixed bottom-4 right-4 z-50"
                  style={{
                      maxWidth: "300px",
                      minWidth: "fit-content",
                  }}
                >
                    <Alert
                      color={deleteAlert.message.includes("успешно") ? "success" : "danger"}
                      onClose={() => setDeleteAlert({ isVisible: false, message: "" })}
                      className="w-full inline-block rounded-lg shadow-md"
                    >
                        {deleteAlert.message}
                    </Alert>
                </div>
              )}

              {assignAlert.isVisible && (
                <div
                  className="fixed bottom-4 right-4 z-50"
                  style={{
                      maxWidth: "300px",
                      minWidth: "fit-content",
                  }}
                >
                    <Alert
                      color={assignAlert.message.includes("успешно") ? "success" : "danger"}
                      onClose={() => setAssignAlert({ isVisible: false, message: "" })}
                      className="w-full inline-block rounded-lg shadow-md"
                    >
                        {assignAlert.message}
                    </Alert>
                </div>
              )}

              {currentTests && currentTests.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {currentTests.map((test) => {
                        const testCategoryData = categoriesForTests?.find(
                          (category) => category.testId === test.id
                        );
                        const categories = testCategoryData?.categories || [];
                        const subcategories = testCategoryData?.subcategories || [];

                        return (
                          <Card key={test.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 p-6">
                                  <h2 className="text-xl font-bold text-white">{test.title}</h2>
                              </CardHeader>
                              <Divider />
                              <CardBody className="p-6 space-y-4">
                                  <p className="text-gray-700">{test.description}</p>
                                  <div className="flex items-center space-x-2">
                                      <span className="text-sm font-semibold text-gray-600">Количество вопросов:</span>
                                      <Chip color="primary" variant="flat">{test.questions?.length || 0}</Chip>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <span className="text-sm font-semibold text-gray-600">Предмет:</span>
                                      {categories.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((cat) => (
                                              <Chip key={cat.id} color="secondary" variant="flat">{cat.name}</Chip>
                                            ))}
                                        </div>
                                      ) : (
                                        <Chip color="default" variant="flat">Не указано</Chip>
                                      )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <span className="text-sm font-semibold text-gray-600">Темы:</span>
                                      {subcategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {subcategories.map((subcategory) => (
                                              <Chip key={subcategory.id} color="success"
                                                    variant="flat">{subcategory.name}</Chip>
                                            ))}
                                        </div>
                                      ) : (
                                        <Chip color="default" variant="flat">Не указано</Chip>
                                      )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <span className="text-sm font-semibold text-gray-600">Назначенные классы:</span>
                                      {test.testAssignments && test.testAssignments.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {test.testAssignments
                                              .filter((assignment) => assignment.class?.classId !== null)
                                              .map((assignment) => (
                                                <Chip
                                                  key={assignment.id}
                                                  color="primary"
                                                  variant="flat"
                                                  onClose={
                                                      user?.role === "TEACHER" && test.teacherId === user?.id
                                                        ? () => handleRemoveAssignment(test.id, assignment.classId)
                                                        : undefined
                                                  }
                                                >
                                                    {assignment.class ? assignment.class.name : "Без класса"}
                                                </Chip>
                                              ))}
                                        </div>
                                      ) : (
                                        <Chip color="default" variant="flat">Все</Chip>
                                      )}
                                  </div>
                              </CardBody>
                              <Divider />
                              <CardFooter className="p-4 flex justify-end space-x-4">
                                  {user?.role === "TEACHER" && test.teacherId === user?.id && (
                                    <>
                                        <Button
                                          variant="flat"
                                          color="warning"
                                          onClick={() => handleToggleVisibility(test.id)}
                                        >
                                            {test.isHidden ? "Показать" : "Скрыть"}
                                        </Button>
                                        <Button
                                          color="primary"
                                          startContent={<FaEdit />}
                                          onClick={() => navigate(`/edit-test/${test.id}`)}
                                        >
                                            Редактировать
                                        </Button>
                                        <Button
                                          color="danger"
                                          startContent={<BiTrash />}
                                          onClick={() => handleDeleteTest(test.id)}
                                        >
                                            Удалить
                                        </Button>
                                        <Button
                                          color="primary"
                                          onClick={() => {
                                              setSelectedTestForAssign(test.id);
                                              setIsAssignModalOpen(true);
                                          }}
                                        >
                                            Назначить классам
                                        </Button>
                                    </>
                                  )}
                                  <Button
                                    color="success"
                                    onClick={() => navigate(`/tests/${test.id}`)}
                                  >
                                      Пройти тест
                                  </Button>
                              </CardFooter>
                          </Card>
                        );
                    })}
                </div>
              ) : (
                <p>Тесты не найдены.</p>
              )}

              <div className="flex justify-center mt-9">
                  <Pagination
                    isCompact
                    showControls
                    total={Math.ceil((filteredTests?.length || 0) / testsPerPage)}
                    initialPage={1}
                    onChange={(page) => setCurrentPage(page)}
                  />
              </div>
          </div>

          {/* Правая колонка: фильтры */}
          <div className="w-1/4">
              <div className="sticky top-4">
                  <Select
                    label="Выберите категории"
                    selectionMode="multiple"
                    selectedKeys={selectedCategories}
                    onSelectionChange={(keys) => handleCategoryChange(keys as Iterable<string>)}
                  >
                      {allCategories?.map((category) => (
                        <SelectItem key={category.id}>{category.name}</SelectItem>
                      ))}
                  </Select>

                  {selectedCategories.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Выберите тему:</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedCategories.map((categoryId) => {
                                const category = allCategories?.find((cat) => cat.id === categoryId);
                                return category?.subcategories?.map((subcategory) => (
                                  <Chip
                                    key={subcategory.id}
                                    color={selectedSubcategories.includes(subcategory.id) ? "primary" : "default"}
                                    onClick={() => handleSubcategoryChange(subcategory.id)}
                                    className="cursor-pointer"
                                  >
                                      {subcategory.name}
                                  </Chip>
                                ));
                            })}
                        </div>

                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Выбранные темы:</h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedSubcategories.map((subId) => {
                                    const subcategory = allCategories
                                      ?.flatMap((cat) => cat.subcategories || [])
                                      .find((sub) => sub.id === subId);
                                    return (
                                      <Chip
                                        key={subId}
                                        color="primary"
                                        onClose={() => handleRemoveSubcategory(subId)}
                                        className="cursor-pointer"
                                      >
                                          {subcategory?.name}
                                      </Chip>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                  )}
              </div>
          </div>
          <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
              <ModalContent>
                  <ModalHeader>Назначение теста классам</ModalHeader>
                  <ModalBody>
                      <Select
                        label="Выберите классы"
                        selectionMode="multiple"
                        selectedKeys={selectedClassesForAssign}
                        onSelectionChange={(keys) => setSelectedClassesForAssign(Array.from(keys) as string[])}
                      >
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                            </SelectItem>
                          ))}
                      </Select>
                  </ModalBody>
                  <ModalFooter>
                      <Button onClick={handleAssignTestToClasses}>Назначить</Button>
                      <Button onClick={() => setIsAssignModalOpen(false)}>Отмена</Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
      </div>
    );
};