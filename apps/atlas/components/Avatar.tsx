type AvatarProps = { name: string; size?: "small" | "medium" };

export function Avatar({ name, size = "medium" }: AvatarProps) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span aria-label={`${name} avatar`} className={`avatar avatar-${size}`}>{initials}</span>;
}
