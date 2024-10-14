import { Input } from "../../components/input";
import { useForm } from "react-hook-form";
import { Button } from "@nextui-org/react";
import { useRegisterMutation } from "../../app/services/userApi";
import { ErrorMessage } from "../../components/error-message";
import { hasErrorField } from "../../utils/has-error-field";
import React, { useState } from "react";
import { Select, SelectItem } from "@nextui-org/react";


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
        register // Ensure you have register method destructured
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
    const [successMessage, setSuccessMessage] = useState(""); // State for success message

    const roles = [
        { key: "STUDENT", label: "Студент" },
        { key: "TEACHER", label: "Учитель" },
        { key: "ADMIN", label: "Администратор" }
    ];

    const onSubmit = async (data: Register) => {
        try {
            await registerUser(data).unwrap();
            setSuccessMessage("Пользователь успешно зарегистрирован!");
            setError("");
        } catch (err) {
            if (hasErrorField(err)) {
                setError(err.data.error);
                setSuccessMessage("");
            } else {
                setError("Произошла ошибка при регистрации");
                setSuccessMessage("");
            }
        }
    };

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className= "font-bold text-xl">Зарегестрировать пользователя</div>
            <Input
                control={control}
                required="Обязательное поле"
                label="ФИО"
                name="name"
            />
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
            <Select
                label="Роль"
                placeholder="Выберите роль"
                {...register("role", { required: "Обязательное поле" })}
                className="max-w-xs"
            >
                {roles.map((role) => (
                    <SelectItem key={role.key} value={role.key}>
                        {role.label}
                    </SelectItem>
                ))}
            </Select>
            {errors.role && <span className="text-red-500">{errors.role.message}</span>} {/* Error for role */}

            <ErrorMessage error={error} />
            {successMessage && <div className="text-green-500">{successMessage}</div>} {/* Display success message */}

            <div className="flex gap-2 justify-end">
                <Button fullWidth color="primary" type="submit">
                    Зарегистрировать пользователя
                </Button>
            </div>
        </form>
    );
}
