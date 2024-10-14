import { User, Test } from "../types";
import { api } from "./api";

type TestForm = {
  title: string;
  description: string;
  teacherId: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string[];
  }[];
};

// Новый тип для отправки ответов на тест
type SubmitTestForm = {
  studentId: string; // ID студента
  answers: { [questionId: string]: string }; // Ответы на вопросы
};

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
      query: (teacherId) => ({
        url: `/teachers/${teacherId}/tests`,
        method: "GET",
      }),
    }),

    updateUser: builder.mutation<User, { userData: FormData; id: string }>({
      query: ({ userData, id }) => ({
        url: `/profile/${id}`,
        method: "PUT",
        body: userData,
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
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useCreateTestMutation,
  useGetTestsQuery,
  useSubmitTestMutation, // Хук для отправки теста
  useGetTeachersQuery,
  useGetTestsByTeacherQuery,
  useUpdateUserMutation
} = userApi;

// Экспортируем эндпоинты
export const {
  endpoints: { login, register, current, getUserById, updateUser, createTest, getTests, submitTest, getTeachers, getTestsByTeacher },
} = userApi;
