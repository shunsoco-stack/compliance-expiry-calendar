import type { Category } from "@/lib/types";
import { categories } from "@/lib/types";
import { Icon } from "./icon";

export function CategoryBadge({ category }: { category: Category }) {
  const index = categories.indexOf(category);
  return (
    <span className={`category-badge category-${index}`}>
      <Icon name={["shield", "car", "list", "umbrella"][index]} size={16} />
      {category}
    </span>
  );
}
