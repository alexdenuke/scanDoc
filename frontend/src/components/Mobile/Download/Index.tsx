import { DownloadIcon } from "@/components/Icons/Icons";
import React from "react";
interface ActionsProps {
  onExportJPG: () => void;
  onExportPDF: () => void;
}
import styles from "./style.module.scss";

export default function DownlaodMobile({
  onExportJPG,
  onExportPDF,
}: ActionsProps) {
  return (
    <div className={styles.actions__export}>
      <span className={styles.actions__exportText}>Экспортировать в:</span>
      <div className={styles.actions__exportButtons}>
        <button className={styles.actions__exportButton} onClick={onExportJPG}>
          <DownloadIcon />
          <span>JPG</span>
        </button>
        <button className={styles.actions__exportButton} onClick={onExportPDF}>
          <DownloadIcon />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
}
