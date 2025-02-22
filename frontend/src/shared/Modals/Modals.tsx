import React from "react";
import styles from "./Modals.module.scss";
import Cookies from "js-cookie";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}></div>
      <div className={styles.modal}>
        <div className={styles.modal__body}>{children}</div>
        {Cookies.get("token") && (
          <button className={styles.modal__close} onClick={onClose}>
            <span></span>
          </button>
        )}
      </div>
    </>
  );
};

export default Modal;
