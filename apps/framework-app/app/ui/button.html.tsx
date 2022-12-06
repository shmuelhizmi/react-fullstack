import React from 'react';

export interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
    return <button onClick={onClick}>{children}</button>;
}
