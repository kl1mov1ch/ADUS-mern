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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Badge,
    Accordion,
    AccordionItem,
    Checkbox,
    Tooltip
} from "@nextui-org/react";
import { ErrorMessage } from "../../components/error-message";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { IoIosSearch, IoMdClose } from "react-icons/io";
import { FaEdit, FaEye, FaEyeSlash, FaFilter } from "react-icons/fa";
import { BiTrash, BiListCheck, BiCategory, BiBook, BiInfinite } from "react-icons/bi"
import { useNavigate } from "react-router-dom";
import { MdAssignment, MdCategory, MdSubject } from "react-icons/md";
import { motion } from "framer-motion";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTestForAssign, setSelectedTestForAssign] = useState<string | null>(null);
    const [selectedClassesForAssign, setSelectedClassesForAssign] = useState<string[]>([]);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");
    const [subcategorySearch, setSubcategorySearch] = useState("");
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

    const testIds = tests?.map((test) => test.id) || [];
    const { data: categoriesForTests } = useGetCategoriesAndSubcategoriesForTestQuery(testIds, {
        skip: testIds.length === 0,
    });
    const { data: allCategories } = useGetAllCategoriesQuery();

    if (isLoading) return (
      <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" aria-label="Загружаем тесты и категории..." />
      </div>
    );
    if (error) return <ErrorMessage error="Ошибка при загрузке тестов" />;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const handleStartTestClick = (testId: string) => {
        setSelectedTestId(testId);
        setIsConfirmModalOpen(true);
    };

    const confirmStartTest = () => {
        if (selectedTestId) {
            navigate(`/tests/${selectedTestId}`);
            setIsConfirmModalOpen(false);
        }
    };

    const handleAssignTestToClasses = async () => {
        if (selectedTestForAssign && selectedClassesForAssign.length > 0) {
            try {
                await assignTestToClass({
                    testId: selectedTestForAssign,
                    classIds: selectedClassesForAssign,
                }).unwrap();
                toast.success("Тест успешно назначен выбранным классам!", {
                    position: "top-right",
                    autoClose: 3000,
                });
                setIsAssignModalOpen(false);
                setSelectedClassesForAssign([]);
                refetch();
            } catch (error) {
                console.error("Ошибка при назначении теста:", error);
                toast.error("Ошибка при назначении теста", {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        } else {
            toast.warning("Пожалуйста, выберите тест и хотя бы один класс", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleToggleVisibility = async (testId: string) => {
        try {
            await updateTestVisibility(testId).unwrap();
            toast.success("Видимость теста успешно изменена", {
                position: "top-right",
                autoClose: 3000,
            });
            refetch();
        } catch (error) {
            console.error("Ошибка при изменении видимости теста:", error);
            toast.error("Ошибка при изменении видимости теста", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleRemoveAssignment = async (testId: string, classId: string) => {
        try {
            await removeTestAssignment({ testId, classId }).unwrap();
            toast.success("Назначение успешно удалено", {
                position: "top-right",
                autoClose: 3000,
            });
            refetch();
        } catch (error) {
            console.error("Ошибка при удалении назначения:", error);
            toast.error("Ошибка при удалении назначения", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
          prev.includes(categoryId)
            ? prev.filter(id => id !== categoryId)
            : [...prev, categoryId]
        );
        // Clear subcategories when category is deselected
        if (selectedCategories.includes(categoryId)) {
            const category = allCategories?.find(cat => cat.id === categoryId);
            const subIds = category?.subcategories?.map(sub => sub.id) || [];
            setSelectedSubcategories(prev => prev.filter(id => !subIds.includes(id)));
        }
    };

    const toggleSubcategory = (subcategoryId: string) => {
        setSelectedSubcategories(prev =>
          prev.includes(subcategoryId)
            ? prev.filter(id => id !== subcategoryId)
            : [...prev, subcategoryId]
        );
    };

    const handleDeleteTest = async (testId: string) => {
        try {
            await deleteTest(testId).unwrap();
            toast.success("Тест успешно удален", {
                position: "top-right",
                autoClose: 3000,
            });
            refetch();
        } catch (error) {
            toast.error("Ошибка при удалении теста", {
                position: "top-right",
                autoClose: 3000,
            });
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
      <div className="test-list px-4 py-6 max-w-7xl mx-auto">
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />

          {/* Заголовок и поиск */}
          <div className="mb-6">
              <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Список тестов
              </h1>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="w-full md:w-1/2">
                      <Input
                        type="text"
                        placeholder="Поиск по названию теста"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startContent={<IoIosSearch />}
                        endContent={
                          searchQuery && (
                            <IoMdClose
                              className="cursor-pointer text-gray-500 hover:text-gray-700"
                              onClick={() => setSearchQuery("")}
                            />
                          )
                        }
                        classNames={{
                            inputWrapper: "border-1 border-gray-300 hover:border-primary",
                            input: "text-gray-700 dark:text-gray-300"
                        }}
                      />
                  </div>

                  <div className="flex gap-2">
                      <Button
                        color="primary"
                        variant="ghost"
                        startContent={<FaFilter />}
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="md:hidden"
                      >
                          Фильтры
                      </Button>
                  </div>
              </div>
          </div>

          {/* Selected filters display */}
          {(selectedCategories.length > 0 || selectedSubcategories.length > 0) && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">Активные фильтры:</span>
                    {selectedCategories.map(catId => {
                        const category = allCategories?.find(c => c.id === catId);
                        return (
                          <Chip
                            key={catId}
                            color="primary"
                            variant="solid"
                            onClose={() => toggleCategory(catId)}
                            classNames={{
                                base: "cursor-pointer",
                                content: "flex items-center gap-1"
                            }}
                          >
                              <MdCategory className="text-sm" />
                              {category?.name}
                          </Chip>
                        );
                    })}
                    {selectedSubcategories.map(subId => {
                        const subcategory = allCategories
                          ?.flatMap(cat => cat.subcategories || [])
                          .find(sub => sub.id === subId);
                        return (
                          <Chip
                            key={subId}
                            color="secondary"
                            variant="solid"
                            onClose={() => toggleSubcategory(subId)}
                            classNames={{
                                base: "cursor-pointer",
                                content: "flex items-center gap-1"
                            }}
                          >
                              <BiCategory className="text-sm" />
                              {subcategory?.name}
                          </Chip>
                        );
                    })}
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onClick={() => {
                          setSelectedCategories([]);
                          setSelectedSubcategories([]);
                      }}
                    >
                        Очистить все
                    </Button>
                </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
              {/* Основной контент - список тестов */}
              <div className="flex-1">
                  {currentTests && currentTests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {currentTests.map((test) => {
                            const testCategoryData = categoriesForTests?.find(
                              (category) => category.testId === test.id
                            );
                            const categories = testCategoryData?.categories || [];
                            const subcategories = testCategoryData?.subcategories || [];
                            const isTestOwner = user?.role === "TEACHER" && test.teacherId === user?.id;

                            return (
                              <motion.div
                                key={test.id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ duration: 0.3 }}
                              >
                                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-1 border-gray-200 dark:border-gray-700">
                                      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                                          <div className="flex justify-between items-center w-full">
                                              <h2 className="text-lg md:text-xl font-bold text-white">{test.title}</h2>
                                              {test.isHidden && (
                                                <span className="flex items-center gap-1 bg-danger text-white dark:bg-gray-700  dark:text-gray-200 px-2 py-1 rounded-md text-xs font-medium shadow-sm">
                                                  <FaEyeSlash className="text-xs" />
                                                  Скрыт
                                                </span>)}
                                          </div>
                                      </CardHeader>
                                      <Divider />
                                      <CardBody className="p-4 space-y-3">
                                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                                              <span className="font-semibold">Описание:</span> {test.description || 'Нет описания'}
                                          </p>

                                          <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-sm font-semibold">Вопросы:</span>
                                              <Chip color="primary" variant="flat" startContent={<BiListCheck />}>
                                                  {test.questions?.length || 0}
                                              </Chip>
                                          </div>

                                          {categories.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold">Предметы:</span>
                                                {categories.map(category => (
                                                  <Chip
                                                    key={category.id}
                                                    color="secondary"
                                                    variant="flat"
                                                    startContent={<MdCategory />}
                                                    className="cursor-pointer hover:bg-secondary-200 dark:hover:bg-secondary-700"
                                                    onClick={() => toggleCategory(category.id)}
                                                  >
                                                      {category.name}
                                                  </Chip>
                                                ))}
                                            </div>
                                          )}

                                          {subcategories.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold">Темы:</span>
                                                {subcategories.map(subcategory => (
                                                  <Chip
                                                    key={subcategory.id}
                                                    color="success"
                                                    variant="flat"
                                                    startContent={<BiCategory />}
                                                    className="cursor-pointer hover:bg-success-200 dark:hover:bg-success-700"
                                                    onClick={() => toggleSubcategory(subcategory.id)}
                                                  >
                                                      {subcategory.name}
                                                  </Chip>
                                                ))}
                                            </div>
                                          )}

                                          {test.testAssignments && test.testAssignments.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold">Классы:</span>
                                                {test.testAssignments
                                                  .filter((assignment) => assignment.class?.classId !== null)
                                                  .map((assignment) => (
                                                    isTestOwner ? (
                                                      <Tooltip key={assignment.id} content="Нажмите для удаления">
                                                          <Chip
                                                            color="primary"
                                                            variant="flat"
                                                            onClick={() => handleRemoveAssignment(test.id, assignment.classId)}
                                                            className="cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-700"
                                                          >
                                                              {assignment.class ? assignment.class.name : "Без класса"}
                                                          </Chip>
                                                      </Tooltip>
                                                    ) : (
                                                      <Chip
                                                        key={assignment.id}
                                                        color="primary"
                                                        variant="flat"
                                                      >
                                                          {assignment.class ? assignment.class.name : "Без класса"}
                                                      </Chip>
                                                    )
                                                  ))}
                                            </div>)}
                                      </CardBody>
                                      <Divider />
                                      <CardFooter className="p-3 flex flex-wrap justify-end gap-2">
                                          {user?.role === "TEACHER" && test.teacherId === user?.id && (
                                            <>
                                                <Button
                                                  size="sm"
                                                  variant="flat"
                                                  color="warning"
                                                  onClick={() => handleToggleVisibility(test.id)}
                                                  startContent={test.isHidden ? <FaEye /> : <FaEyeSlash />}
                                                  className="hover:bg-warning-100 dark:hover:bg-warning-900/50"
                                                >
                                                    {test.isHidden ? "Показать" : "Скрыть"}
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  color="primary"
                                                  variant="flat"
                                                  startContent={<FaEdit />}
                                                  onClick={() => navigate(`/edit-test/${test.id}`)}
                                                  className="hover:bg-primary-100 dark:hover:bg-primary-900/50"
                                                >
                                                    Редактировать
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  color="danger"
                                                  variant="flat"
                                                  startContent={<BiTrash />}
                                                  onClick={() => handleDeleteTest(test.id)}
                                                  className="hover:bg-danger-100 dark:hover:bg-danger-900/50"
                                                >
                                                    Удалить
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  color="primary"
                                                  variant="ghost"
                                                  startContent={<MdAssignment />}
                                                  onClick={() => {
                                                      setSelectedTestForAssign(test.id)
                                                      setIsAssignModalOpen(true)
                                                  }}
                                                >
                                                    Назначить
                                                </Button>
                                            </>
                                          )}
                                          <Button
                                            size="sm"
                                            color="green"
                                            variant="ghost"
                                            startContent={<BiBook />}
                                            onClick={() => handleStartTestClick(test.id)}
                                            className="hover:bg-success-500 hover:text-white"
                                          >
                                              Пройти тест
                                          </Button>
                                      </CardFooter>
                                  </Card>
                              </motion.div>
                            );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">Тесты не найдены</p>
                        <Button
                          color="primary"
                          variant="flat"
                          className="mt-4"
                          onClick={() => {
                              setSearchQuery("");
                              setSelectedCategories([]);
                              setSelectedSubcategories([]);
                          }}
                        >
                            Сбросить фильтры
                        </Button>
                    </div>
                  )}

                  {filteredTests && filteredTests.length > 0 && (
                    <div className="flex justify-center mt-6">
                        <Pagination
                          isCompact
                          showControls
                          total={Math.ceil((filteredTests?.length || 0) / testsPerPage)}
                          initialPage={1}
                          page={currentPage}
                          onChange={(page) => setCurrentPage(page)}
                          color="primary"
                          variant="flat"
                        />
                    </div>
                  )}
              </div>

              {/* Фильтры - скрыты на мобильных, показываются по кнопке */}
              {(isFiltersOpen || window.innerWidth >= 1024) && (
                <div className="w-full lg:w-80 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md lg:sticky lg:top-4 lg:h-fit border-1 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Фильтры</h3>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onClick={() => setIsFiltersOpen(false)}
                          className="lg:hidden"
                        >
                            <IoMdClose />
                        </Button>
                    </div>

                    <Accordion defaultSelectedKeys={["1"]} variant="splitted">
                        <AccordionItem
                          key="1"
                          title="Предметы"
                          startContent={<MdCategory className="text-lg" />}
                        >
                            <div className="space-y-3">
                                <Input
                                  placeholder="Поиск по предметам..."
                                  startContent={<IoIosSearch className="text-lg" />}
                                  classNames={{
                                      inputWrapper: "h-10",
                                  }}
                                  onChange={(e) => {
                                      const searchTerm = e.target.value.toLowerCase();
                                      setCategorySearch(searchTerm);
                                  }}
                                />
                                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                    {allCategories
                                      ?.filter(category =>
                                        category.name.toLowerCase().includes(categorySearch.toLowerCase())
                                      )
                                      .map((category) => (
                                        <Chip
                                          key={category.id}
                                          color={selectedCategories.includes(category.id) ? "primary" : "default"}
                                          variant={selectedCategories.includes(category.id) ? "solid" : "flat"}
                                          onClick={() => toggleCategory(category.id)}
                                          className="cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30"
                                          startContent={<MdCategory className="text-sm" />}
                                        >
                  <span className="truncate max-w-[120px] inline-block">
                    {category.name}
                  </span>
                                        </Chip>
                                      ))}
                                </div>
                            </div>
                        </AccordionItem>

                        {selectedCategories.length > 0 && (
                          <AccordionItem
                            key="2"
                            title="Темы"
                            startContent={<BiCategory className="text-lg" />}
                          >
                              <div className="space-y-3">
                                  <Input
                                    placeholder="Поиск по темам..."
                                    startContent={<IoIosSearch className="text-lg" />}
                                    classNames={{
                                        inputWrapper: "h-10",
                                    }}
                                    onChange={(e) => {
                                        const searchTerm = e.target.value.toLowerCase();
                                        setSubcategorySearch(searchTerm);
                                    }}
                                  />
                                  <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-scroll">
                                      {selectedCategories.map((categoryId) => {
                                          const category = allCategories?.find((cat) => cat.id === categoryId);
                                          return category?.subcategories
                                            ?.filter(subcategory =>
                                              subcategory.name.toLowerCase().includes(subcategorySearch.toLowerCase())
                                            )
                                            .map((subcategory) => (
                                              <Tooltip
                                                key={subcategory.id}
                                                content={subcategory.name}
                                                placement="top"
                                                delay={300}
                                                closeDelay={100}
                                                classNames={{
                                                    base: "max-w-[200px]",
                                                    content: "bg-foreground text-background",
                                                }}
                                              >
                                                  <Chip
                                                    color={
                                                        selectedSubcategories.includes(subcategory.id)
                                                          ? "secondary"
                                                          : "default"
                                                    }
                                                    variant={
                                                        selectedSubcategories.includes(subcategory.id)
                                                          ? "solid"
                                                          : "flat"
                                                    }
                                                    onClick={() => toggleSubcategory(subcategory.id)}
                                                    className="cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-900/30 max-w-[200px]"
                                                    startContent={<BiCategory className="text-sm" />}
                                                  >
                  <span className="truncate inline-block max-w-[170px]">
                    {subcategory.name}
                  </span>
                                                  </Chip>
                                              </Tooltip>
                                            ));
                                      })}
                                  </div>
                              </div>
                          </AccordionItem>
                        )}
                    </Accordion>
                </div>
              )}
          </div>

          {/* Модальное окно назначения теста классам */}
          <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
              <ModalContent>
                  <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                      Назначение теста классам
                  </ModalHeader>
                  <Divider />
                  <ModalBody className="p-6">
                      <Select
                        label="Выберите классы"
                        selectionMode="multiple"
                        selectedKeys={selectedClassesForAssign}
                        onSelectionChange={(keys) => setSelectedClassesForAssign(Array.from(keys) as string[])}
                        className="w-full"
                        variant="bordered"
                      >
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                            </SelectItem>
                          ))}
                      </Select>
                  </ModalBody>
                  <ModalFooter className="border-t border-default-200 pt-4">
                      <Button
                        color="default"
                        variant="light"
                        onClick={() => setIsAssignModalOpen(false)}
                      >
                          Отмена
                      </Button>
                      <Button
                        color="primary"
                        onClick={handleAssignTestToClasses}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      >
                          Назначить
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
          <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
              <ModalContent>
                  <ModalHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                      Подтверждение начала теста
                  </ModalHeader>
                  <Divider />
                  <ModalBody className="p-6">
                      <p className="text-gray-700 dark:text-gray-300">
                          Вы уверены, что хотите начать прохождение теста? После начала теста будет запущен таймер,
                          и вам нужно будет завершить тест до его окончания.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-warning-600 dark:text-warning-400">
                          <BiInfinite className="text-lg" />
                          <span className="text-sm font-medium">
          {tests?.find(t => t.id === selectedTestId)?.timeLimit
            ? `Время на прохождение: ${tests.find(t => t.id === selectedTestId)?.timeLimit} минут`
            : 'Тест без ограничения времени'}
        </span>
                      </div>
                  </ModalBody>
                  <ModalFooter className="border-t border-default-200 pt-4">
                      <Button
                        color="default"
                        variant="light"
                        onClick={() => setIsConfirmModalOpen(false)}
                      >
                          Отмена
                      </Button>
                      <Button
                        color="primary"
                        onClick={confirmStartTest}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      >
                          Начать тест
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
      </div>
    );
};