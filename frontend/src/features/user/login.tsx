// components/Login.tsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { Input } from "../../components/input";
import { ErrorMessage } from "../../components/error-message";
import { useLazyCurrentQuery, useLoginMutation } from "../../app/services/userApi";
import { hasErrorField } from "../../utils/has-error-field";

type Login = {
  email: string;
  password: string;
};

// Определяем тип для пропсов
type Props = {
  setSelected: (value: string) => void;
};

export const Login: React.FC<Props> = ({ setSelected }) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Login>({
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [triggerCurrentQuery] = useLazyCurrentQuery();

  const from = location.state?.from?.pathname || "/tests";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const fetchCurrentUser = async () => {
        try {
          await triggerCurrentQuery();
        } catch (err) {
          console.error("Ошибка при загрузке текущего пользователя", err);
        }
      };
      fetchCurrentUser();
    }
  }, [triggerCurrentQuery]);

  const onSubmit = async (data: Login) => {
    try {
      const result = await login(data).unwrap();
      localStorage.setItem("token", result.token);  // Сохраняем токен в localStorage
      await triggerCurrentQuery();
      navigate("/tests", { replace: true });
      setError("");
    } catch (err) {
      setError("Ошибка при логине");
    }
  };


  return (
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
            control={control}
            name="email"
            label="Email"
            type="email"
            required="Обязательное поле"
        />
        <Input
            control={control}
            name="password"
            label="Пароль"
            type="password"
            required="Обязательное поле"
        />
        <ErrorMessage error={error} />
        <div className="flex gap-2 justify-end">
          <Button fullWidth color="primary" type="submit" isLoading={isLoading}>
            Войти
          </Button>
        </div>
      </form>
  );
};
