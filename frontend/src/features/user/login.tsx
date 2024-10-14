import { Input } from "../../components/input";
import { useForm } from "react-hook-form";
import { Button } from "@nextui-org/react";
import { useLazyCurrentQuery, useLoginMutation } from "../../app/services/userApi";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ErrorMessage } from "../../components/error-message";
import { hasErrorField } from "../../utils/has-error-field";

type Login = {
  email: string;
  password: string;
};

type Props = {
  setSelected: (value: string) => void;
};

export const Login = ({ setSelected }: Props) => {
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
  const [error, setError] = useState("");
  const [triggerCurrentQuery] = useLazyCurrentQuery();

  // Восстановление состояния пользователя при загрузке приложения
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Если токен существует, запрашиваем информацию о текущем пользователе
      const fetchCurrentUser = async () => {
        try {
          await triggerCurrentQuery(); // Вызываем запрос для получения текущего пользователя
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

      // Сохраняем токен в localStorage
      localStorage.setItem("token", result.token);

      // Запрашиваем текущего пользователя
      await triggerCurrentQuery();

      // Навигация после успешного логина
      navigate("/");

      // Очищаем ошибки
      setError("");
    } catch (err) {
      if (hasErrorField(err)) {
        setError(err.data.error || "Ошибка при логине");
      } else {
        setError("Ошибка при логине");
      }
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
