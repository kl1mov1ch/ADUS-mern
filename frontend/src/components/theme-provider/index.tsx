import React, { useState, useEffect } from "react";

type Theme = "dark" | "light" | "gray";

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
};

export const ThemeContext = React.createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const defaultTheme: Theme = "light";

    const [theme, setTheme] = useState<Theme>(defaultTheme);

    useEffect(() => {
        document.documentElement.className = theme; // Применяем класс темы к HTML элементу
        localStorage.setItem("theme", theme); // Сохраняем тему в localStorage
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            if (prevTheme === "light") return "dark";
            if (prevTheme === "dark") return "gray";
            return "light";
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
