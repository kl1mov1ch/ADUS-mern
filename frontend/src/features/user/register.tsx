import { useForm } from "react-hook-form";
import { Button, Card, Divider, Select, SelectItem } from "@nextui-org/react";
import { useRegisterMutation } from "../../app/services/userApi";
import { ErrorMessage } from "../../components/error-message";
import { hasErrorField } from "../../utils/has-error-field";
import React, { useState } from "react";
import { Input as NextUIInput } from "@nextui-org/react";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";
import { motion } from "framer-motion";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Register = {
  email: string;
  name: string;
  password: string;
  role: string;
}

export const Register = () => {
  const {
    handleSubmit,
    control,
    formState: { errors },
    register
  } = useForm<Register>({
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "STUDENT",
    },
  });

  const [registerUser] = useRegisterMutation();
  const [error, setError] = useState("");

  const roles = [
    { key: "STUDENT", label: "Студент" },
    { key: "TEACHER", label: "Учитель" },
    { key: "ADMIN", label: "Администратор" }
  ];

  const onSubmit = async (data: Register) => {
    try {
      await registerUser(data).unwrap();
      toast.success('Пользователь успешно зарегистрирован!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setError("");
    } catch (err) {
      if (hasErrorField(err)) {
        setError(err.data.error);
        toast.error(err.data.error, {
          position: "top-right",
        });
      } else {
        setError("Произошла ошибка при регистрации");
        toast.error("Произошла ошибка при регистрации", {
          position: "top-right",
        });
      }
    }
  };

  return (
    <div className="flex justify-center">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 overflow-hidden shadow-xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Регистрация пользователя
            </h1>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
              <NextUIInput
                label="ФИО"
                placeholder="Введите ФИО пользователя"
                labelPlacement="outside"
                startContent={
                  <MdPerson className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                }
                variant="bordered"
                radius="lg"
                classNames={{
                  inputWrapper: "h-12",
                }}
                {...register("name", {
                  required: "Обязательное поле",
                })}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />

              <NextUIInput
                label="Email"
                placeholder="Введите email пользователя"
                labelPlacement="outside"
                startContent={
                  <MdEmail className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                }
                variant="bordered"
                radius="lg"
                classNames={{
                  inputWrapper: "h-12",
                }}
                {...register("email", {
                  required: "Обязательное поле",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Некорректный email",
                  },
                })}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />

              <NextUIInput
                label="Пароль"
                placeholder="Введите пароль"
                labelPlacement="outside"
                startContent={
                  <MdLock className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                }
                type="password"
                variant="bordered"
                radius="lg"
                classNames={{
                  inputWrapper: "h-12",
                }}
                {...register("password", {
                  required: "Обязательное поле",
                  minLength: {
                    value: 4,
                    message: "Пароль должен содержать минимум 4 символов",
                  },
                })}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
              />

              <Select
                label="Роль"
                placeholder="Выберите роль пользователя"
                labelPlacement="outside"
                variant="bordered"
                radius="lg"
                classNames={{
                  trigger: "h-12",
                }}
                {...register("role", { required: "Обязательное поле" })}
                defaultSelectedKeys={["STUDENT"]}
                isInvalid={!!errors.role}
                errorMessage={errors.role?.message}
              >
                {roles.map((role) => (
                  <SelectItem key={role.key} value={role.key}>
                    {role.label}
                  </SelectItem>
                ))}
              </Select>

              <ErrorMessage error={error} />

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  fullWidth
                  color="primary"
                  type="submit"
                  className="mt-2 h-12 text-lg font-medium"
                >
                  Зарегистрировать
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};