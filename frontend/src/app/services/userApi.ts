import { User, Test, TestForm, Question } from "../types"
import { api } from "./api";

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Эндпоинт для входа
    login: builder.mutation<{ token: string; user: User }, { email: string; password: string }>({
      query: (userData) => ({
        url: "/login",
        method: "POST",
        body: userData,
      }),
    }),

    // Эндпоинт для регистрации
    register: builder.mutation<{ email: string; password: string; name: string }, { email: string; password: string; name: string }>({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
    }),

    // Эндпоинт для получения текущего пользователя
    current: builder.query<User, void>({
      query: () => ({
        url: "/current",
        method: "GET",
      }),
    }),

    // Эндпоинт для получения пользователя по ID
    getUserById: builder.query<User, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
    }),

    // Эндпоинт для получения всех пользователей
    getUsers: builder.query<User[], void>({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
    }),

    // Эндпоинт для удаления пользователя
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
    }),

    // Эндпоинт для создания теста
    createTest: builder.mutation<void, TestForm>({
      query: (testData) => ({
        url: "/test",
        method: "POST",
        body: testData,
      }),
    }),

    getTests: builder.query<Test[], void>({
      query: () => ({
        url: "/tests",
        method: "GET",
      }),
    }),

    submitTest: builder.mutation<{ correctAnswersCount: number; percentage: string; mark: number }, { testId: string; studentId: string; answers: { [questionId: string]: string } }>({
      query: ({ testId, studentId, answers }) => ({
        url: `/submit-test`, // Маршрут на сервере
        method: "POST",
        body: { testId, studentId, answers }, // Данные, которые отправляются на сервер
      }),
    }),

    getTeachers: builder.query<User[], void>({
      query: () => ({
        url: "/teachers",
        method: "GET",
      }),
    }),

    getTestsByTeacher: builder.query<Test[], string>({
      query: (id) => ({
        url: `/teachers/${id}/tests`,
        method: "GET",
      }),
    }),

    updateAvatar: builder.mutation<User, { id: string; avatar: File }>({
      query: ({ id, avatar }) => {
        const formData = new FormData();
        formData.append('avatar', avatar);
        formData.append('userId', id);

        return {
          url: '/profile/upload-avatar',
          method: "POST",
          body: formData,
        };
      },
    }),

    updateUserAvatar: builder.mutation<User, { userId: string; avatar: File }>({
      query: ({ userId, avatar }) => {
        const formData = new FormData();
        formData.append('avatar', avatar);
        formData.append('userId', userId);

        return {
          url: `/profile/${userId}/avatar`,
          method: "PUT",
          body: formData,
        };
      },
    }),

    updateUser: builder.mutation<User, { userData: { email: string; name: string; avatarUrl: string; role: string, classId: string }; id: string }>({
      query: ({ userData, id }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: userData,
      }),
    }),

    generateTest: builder.mutation<{ test: Question[] }, {
      topic: string;
      difficulty: string;
      numberOfQuestions: number;
      language: string;
      correctAnswersCount: number;
      optionsCount: number
    }>({
      query: (data) => ({
        url: '/generate-test',
        method: 'POST',
        body: data,
      }),
    }),

    getClassesByUserId: builder.query<any, string>({
      query: (userId) => ({
        url: `/users/${userId}/classes`,
        method: "GET",
      }),
    }),

    getTeachersMarks: builder.query<any, number>({
      query: (teacherId) => ({
        url: `/test-results/${teacherId}`,
        method: "GET",
      }),
    }),

    getStudentMarks: builder.query<any, number>({
      query: (userId) => ({
        url: `/student-marks/${userId}`,
        method: "GET",
      }),
    }),


    chatGPT: builder.mutation<{ reply: string }, { message: string }>({
      query: (data) => ({
        url: '/chat',
        method: 'POST',
        body: data,
      }),
    }),

    updateTest: builder.mutation<void, { testId: string; testData: FormData }>({
      query: ({ testId, testData }) => ({
        url: `/test/${testId}`,
        method: "PUT",
        body: testData,
      }),
    }),

    deleteTest: builder.mutation<void, string>({
      query: (testId) => ({
        url: `/test/${testId}`,
        method: "DELETE",
      }),
    }),

    updateTestVisibility: builder.mutation<void, string>({
      query: (testId) => ({
        url: `/tests/${testId}/toggle-visibility`,
        method: "PUT",
      }),
    }),

    assignTestToClass: builder.mutation<void, { testId: string; classIds: string[] }>({
      query: ({ testId, classIds }) => ({
        url: `/tests/${testId}/assign-to-class`,
        method: "POST",
        body: { classIds }, // Передаем массив classIds
      }),
    }),

    removeTestAssignment: builder.mutation<void, { testId: string; classId: string }>({
      query: ({ testId, classId }) => ({
        url: `/tests/${testId}/remove-assignment/${classId}`,
        method: "DELETE",
      }),
    }),

    createCategory: builder.mutation<void, { name: string }>({
      query: (categoryData) => ({
        url: "/categories",
        method: "POST",
        body: categoryData,
      }),
    }),

    // Get all categories with their subcategories
    getAllCategories: builder.query<any, void>({
      query: () => ({
        url: "/categories",
        method: "GET",
      }),
    }),

    // Get a specific category with subcategories
    getCategoryById: builder.query<any, string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}`,
        method: "GET",
      }),
    }),

    // Update a category
    updateCategory: builder.mutation<void, { categoryId: string; name: string }>({
      query: ({ categoryId, name }) => ({
        url: `/categories`,
        method: "PUT",
        body: { name, categoryId},
      }),
    }),

    // Delete a category
    deleteCategory: builder.mutation<void, string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}`,
        method: "DELETE",
      }),
    }),

    // Create a new subcategory
    createSubcategory: builder.mutation<void, { name: string; categoryId: string }>({
      query: (subcategoryData) => ({
        url: "/subcategories",
        method: "POST",
        body: subcategoryData,
      }),
    }),

    // Update a subcategory
    updateSubcategory: builder.mutation<void, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/subcategories`,
        method: "PUT",
        body: { name, id},
      }),
    }),

    // Delete a subcategory
    deleteSubcategory: builder.mutation<void, string>({
      query: (subcategoryId) => ({
        url: `/subcategories/${subcategoryId}`,
        method: "DELETE",
      }),
    }),

    getCategoriesAndSubcategoriesForTest: builder.query<any, string>({
      query: (testId) => ({
        url: `/tests/${testId}/categories-and-subcategories`,
        method: "GET",
      }),
    }),

    createClass: builder.mutation<void, { name: string }>({
      query: (classData) => ({
        url: "/classes",
        method: "POST",
        body: classData,
      }),
    }),

    // Получение всех классов
    getAllClasses: builder.query<any, void>({
      query: () => ({
        url: "/classes",
        method: "GET",
      }),
    }),

    // Получение класса по ID
    getClassById: builder.query<any, string>({
      query: (classId) => ({
        url: `/classes/${classId}`,
        method: "GET",
      }),
    }),

    // Обновление класса
    updateClass: builder.mutation<void, { classId: string; name: string }>({
      query: ({ classId, name }) => ({
        url: "/classes",
        method: "PUT",
        body: { classId, name },
      }),
    }),

    // Удаление класса
    deleteClass: builder.mutation<void, string>({
      query: (classId) => ({
        url: `/classes/${classId}`,
        method: "DELETE",
      }),
    }),

    generateTestFromFile: builder.mutation<{ test: Question[] }, {
      file: File;
      topic?: string;
      difficulty: string;
      numberOfQuestions: number;
      language: string;
      correctAnswersCount: number;
      optionsCount: number;
    }>({
      query: (data) => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('difficulty', data.difficulty);
        formData.append('numberOfQuestions', data.numberOfQuestions.toString());
        formData.append('language', data.language);
        formData.append('correctAnswersCount', data.correctAnswersCount.toString());
        formData.append('optionsCount', data.optionsCount.toString());

        if (data.topic) {
          formData.append('topic', data.topic);
        }

        return {
          url: '/generate-test-from-file',
          method: 'POST',
          body: formData,
        };
      },
    }),

    // Добавление пользователя в класс
    addUserToClass: builder.mutation<void, { userId: string; classId: string }>({
      query: ({ userId, classId }) => ({
        url: "/classes/add-user",
        method: "POST",
        body: { userId, classId },
      }),
    }),

    // Удаление пользователя из класса
    removeUserFromClass: builder.mutation<void, { classId: string; userId: string }>({
      query: ({ classId, userId }) => ({
        url: `/classes/${classId}/remove-user/${userId}`,
        method: "DELETE",
      }),
    }),
  }),


});

export const useCurrentUser = () => {
  const { data: currentUser, error, isLoading } = userApi.endpoints.current.useQuery();
  const teacherId = currentUser?.id; // Предполагается, что у пользователя есть поле id

  return { teacherId, error, isLoading };
};

// Экспортируем все хуки
export const {
  useRegisterMutation,
  useLoginMutation,
  useCurrentQuery,
  useLazyCurrentQuery,
  useCreateTestMutation,
  useGetTestsQuery,
  useSubmitTestMutation, // Хук для отправки теста
  useGetTeachersQuery,
  useGetTestsByTeacherQuery,
  useUpdateUserMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useGetTeachersMarksQuery,
  useChatGPTMutation,
  useUpdateAvatarMutation,
  useUpdateUserAvatarMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  useGetStudentMarksQuery,
  useCreateCategoryMutation,
  useGetAllCategoriesQuery,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
  useGetCategoriesAndSubcategoriesForTestQuery,
  useCreateClassMutation,
  useGetAllClassesQuery,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useAddUserToClassMutation,
  useRemoveUserFromClassMutation,
  useGenerateTestMutation,
  useUpdateTestVisibilityMutation,
  useAssignTestToClassMutation,
  useRemoveTestAssignmentMutation,
  useGenerateTestFromFileMutation,

} = userApi;

export const {
  endpoints: { login },
} = userApi;
