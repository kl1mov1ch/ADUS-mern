import { createSlice } from "@reduxjs/toolkit";
import { userApi } from "../../app/services/userApi";
import { RootState } from "../../app/store";
import { Role, User } from "../../app/types";

interface InitialState {
    user: User | null;
    isAuthenticated: boolean;
    users: User[] | null;
    current: User | null;
    token?: string;
    error?: string | null;
    loading: boolean; // Новое состояние для загрузки
}

const initialState: InitialState = {
    user: null,
    isAuthenticated: false,
    users: null,
    current: null,
    error: null,
    loading: false, // Начальное состояние загрузки
};

const slice = createSlice({
    name: "user",
    initialState,
    reducers: {
        logout: () => initialState,
        resetUser: (state) => {
            state.user = null;
            state.isAuthenticated = false; // Также сбрасываем isAuthenticated
        },
        setError: (state, action) => {
            state.error = action.payload; // Установка ошибки
        },
        clearError: (state) => {
            state.error = null; // Сброс ошибки
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(userApi.endpoints.login.matchFulfilled, (state, action) => {
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.user = action.payload.user; // Сохранение пользователя после входа
            })
            .addMatcher(userApi.endpoints.current.matchFulfilled, (state, action) => {
                state.isAuthenticated = true;
                state.current = action.payload;
                state.user = action.payload; // Сохранение текущего пользователя
            })
            .addMatcher(userApi.endpoints.getUserById.matchFulfilled, (state, action) => {
                state.user = action.payload;
            })
            .addMatcher(userApi.endpoints.getTeachers.matchFulfilled, (state, action) => {
                state.users = action.payload; // Сохранение всех пользователей
            })
            .addMatcher(userApi.endpoints.updateUser.matchFulfilled, (state, action) => {
                state.user = { ...state.user, ...action.payload }; // Обновление данных пользователя
            })
            .addMatcher(userApi.endpoints.login.matchRejected, (state, action) => {
                state.error = action.error.message; // Обработка ошибок при входе
            })
            .addMatcher(userApi.endpoints.current.matchRejected, (state, action) => {
                state.error = action.error.message; // Обработка ошибок при получении текущего пользователя
            })
            .addMatcher(userApi.endpoints.getUserById.matchRejected, (state, action) => {
                state.error = action.error.message; // Обработка ошибок при получении пользователя по ID
            })
            .addMatcher(userApi.endpoints.getTeachers.matchRejected, (state, action) => {
                state.error = action.error.message; // Обработка ошибок при получении всех пользователей
            })
            .addMatcher(userApi.endpoints.updateUser.matchRejected, (state, action) => {
                state.error = action.error.message; // Обработка ошибок при обновлении пользователя
            })
            .addMatcher(userApi.endpoints.login.matchPending, (state) => {
                state.loading = true; // Начало загрузки
            })
            .addMatcher(userApi.endpoints.login.matchFulfilled, (state) => {
                state.loading = false; // Конец загрузки
            })
            .addMatcher(userApi.endpoints.login.matchRejected, (state) => {
                state.loading = false; // Конец загрузки
            });
    },
});

export const { logout, resetUser, setError, clearError } = slice.actions;
export default slice.reducer;

// Селекторы для получения данных из состояния
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrent = (state: RootState) => state.auth.current;
export const selectUsers = (state: RootState) => state.auth.users;
export const selectUser = (state: RootState) => state.auth.user;
export const selectError = (state: RootState) => state.auth.error; // Селектор для получения ошибки
export const selectLoading = (state: RootState) => state.auth.loading; // Селектор для получения состояния загрузки
