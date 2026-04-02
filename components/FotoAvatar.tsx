"use client";

interface Props {
  nome: string;
  foto_url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
};

export function FotoAvatar({ nome, foto_url, size = "md", className = "" }: Props) {
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (foto_url) {
    return (
      <img
        src={foto_url}
        alt={nome}
        title={nome}
        className={`rounded-full object-cover border-2 border-white shadow-sm ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      title={nome}
      className={`rounded-full flex items-center justify-center font-bold bg-indigo-600 text-white border-2 border-white shadow-sm ${sizeClasses[size]} ${className}`}
    >
      {iniciais}
    </div>
  );
}
