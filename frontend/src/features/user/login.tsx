import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card, Divider, Image, Link, Input as NextUIInput } from "@nextui-org/react";
import { ErrorMessage } from "../../components/error-message";
import { useLazyCurrentQuery, useLoginMutation } from "../../app/services/userApi";
import { hasErrorField } from "../../utils/has-error-field";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";
import  loginIllustration  from '../../../Animation.json';
import { FaSignInAlt, FaGoogle, FaGithub, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdEmail, MdLock } from "react-icons/md";
import { GiNotebook } from "react-icons/gi";
import Lottie  from "lottie-react";

type Login = {
  email: string;
  password: string;
};

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
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      localStorage.setItem("token", result.token);
      await triggerCurrentQuery();

      toast.success('Вы успешно вошли в систему!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      navigate(from, { replace: true });
      setError("");
    } catch (err) {
      if (hasErrorField(err)) {
        setError(err.data.error);
        toast.error(err.data.error, {
          position: "top-right",
        });
      } else {
        setError("Неизвестная ошибка при входе");
        toast.error("Неизвестная ошибка при входе", {
          position: "top-right",
        });
      }
    }
  };

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-xl">
          {/* Левая часть с иллюстрацией */}
          <div className="hidden md:flex bg-gradient-to-br from-blue-500 to-purple-600 p-8 items-center justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              {/* Логотип как в Header */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer mb-6"
              >
                <p className="font-bold text-3xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  ADUSK
                </p>
              </motion.div>

              <div className="w-full max-w-xs mx-auto">
                <Lottie
                  animationData={loginIllustration}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>

              <h2 className="text-white text-xl font-bold mt-6">
                Добро пожаловать в ADUSK!
              </h2>
              <p className="text-blue-100 mt-2">
                Платформа для тестирования и контроля знаний
              </p>
            </motion.div>

            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, x: Math.random() * 100 - 50 }}
                animate={{
                  y: [0, -100, 0],
                  x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: `${10 + Math.random() * 20}px`,
                  height: `${10 + Math.random() * 20}px`,
                  left: `${10 + Math.random() * 80}%`,
                  bottom: `${Math.random() * 20}%`,
                }}
              />
            ))}
          </div>

          {/* Правая часть с формой */}
          <div className="p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex justify-center md:hidden mb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                >
                  <p className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ADUSK
                  </p>
                  <div className="flex justify-center mt-2">
                    <GiNotebook className="text-blue-600 text-2xl" />
                  </div>
                </motion.div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Вход в систему
              </h1>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                <NextUIInput
                  label="Email"
                  placeholder="Введите ваш email"
                  labelPlacement="outside"
                  startContent={
                    <MdEmail className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                  }
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "h-12",
                  }}
                  {...control.register("email", {
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
                  placeholder="Введите ваш пароль"
                  labelPlacement="outside"
                  startContent={
                    <MdLock className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                  }
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <FaEyeSlash className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <FaEye className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                  type={isVisible ? "text" : "password"}
                  variant="bordered"
                  radius="lg"
                  classNames={{
                    inputWrapper: "h-12",
                  }}
                  {...control.register("password", {
                    required: "Обязательное поле",
                    minLength: {
                      value: 4,
                      message: "Пароль должен содержать минимум 4 символов",
                    },
                  })}
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                />


                <ErrorMessage error={error} />

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    fullWidth
                    color="primary"
                    type="submit"
                    isLoading={isLoading}
                    endContent={!isLoading && <FaSignInAlt />}
                    className="mt-2 h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    {isLoading ? "Вход..." : "Войти"}
                    {isHovered && !isLoading && (
                      <motion.span
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="ml-2 mr-2 "
                      >
                        →
                      </motion.span>
                    )}
                  </Button>
                </motion.div>

              </form>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};