export type User = {
    id: string;
    email: string;
    password: string;
    name?: string;
    avatarUrl?: string;
    dateOfBirth?: string; // ISO string
    role: Role;
    createdAt: string;
    updatedAt: string;
    bio?: string;
    location?: string;
    tests?: Test[];
    grades?: Grade[];
    answers?: Answer[];
    testAssignments?: TestAssignment[];
};


export enum Role {
    ADMIN = "ADMIN",
    TEACHER = "TEACHER",
    STUDENT = "STUDENT"
}

export type Test = {
    id: string;
    title: string;
    description: string;
    teacher: User; // Teacher who created the test
    teacherId: string;
    questions: Question[]; // List of questions
    students?: TestAssignment[]; // List of students assigned to the test
    createdAt: string; // Date in ISO format
    updatedAt: string; // Date in ISO format
    grades?: Grade[]; // List of grades for the test
}

export type Question = {
    id: string;
    text: string;
    options: string[]; // List of possible answers for multiple-choice questions
    correctAnswer: string[]; // The correct answer(s) to the question
    test: Test;
    testId: string;
    answers?: Answer[]; // Answers provided by students
};


export type Answer = {
    id: string;
    content: string; // Student's answer
    student: User;
    studentId: string;
    question: Question;
    questionId: string;
};


export type TestAssignment = {
    id: string;
    test: Test;
    testId: string;
    student: User;
    studentId: string;
    grade?: Grade;
};

export type Grade = {
    id: string;
    value: number; // Grade value (e.g., 0-100)
    student: User;
    studentId: string;
    test: Test;
    testId: string;
};

export type SubmitTestResponse = {
    correctAnswersCount: number; // Количество правильных ответов
    percentage: number; // Процент правильных ответов
    mark: number; // Оценка
    score: number; // Набранный балл
    totalQuestions: number; // Общее количество вопросов
};


