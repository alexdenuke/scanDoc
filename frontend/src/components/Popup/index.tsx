import { ReactNode } from "react";
import styles from "./Popup.module.scss";
import Image from "next/image";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function Popup({ isOpen, onClose, children }: PopupProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.popup}>
            <div className={styles.popup__box} >
                <Image className={styles.popup__close} onClick={onClose} src={"/icons/closeMenu.svg"} alt="close" width={20} height={20} />
                {children}
            </div>
        </div>
    );
}
