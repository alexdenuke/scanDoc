import styles from "./FieldPagination.module.scss";

interface FieldPaginationProps {
  totalPages: number;
  currentPageIndex: number;
  onPageClick: (index: number) => void;
  onAddClick: () => void;
}

const FieldPagination: React.FC<FieldPaginationProps> = ({
  totalPages,
  currentPageIndex,
  onPageClick,
  onAddClick,
}) => {
  const pagesArray = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className={styles.pagination}>
      <ul className={styles.pagination__pages}>
        {pagesArray.map((pageIndex) => (
          <li
            key={pageIndex}
            className={styles.pagination__pagesItem}
            style={{
              background:
                pageIndex === currentPageIndex
                  ? "var(--primary-color)"
                  : "transparent",
              color: pageIndex === currentPageIndex ? "#fff" : "inherit",
            }}
            onClick={() => onPageClick(pageIndex)}
          >
            {pageIndex + 1}
          </li>
        ))}
      </ul>
      <button className={styles.addButton} onClick={onAddClick}></button>
    </div>
  );
};

export default FieldPagination;
