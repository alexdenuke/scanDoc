import { TextIcon, UploadIcon } from "@/components/Icons/Icons";
import styles from "./Signature.module.scss";
import Image from "next/image";

interface SignatureProps {
  callSignatureModal: () => void;
  signatures: string[];
  onSelectSignature: (signature: string) => void;
  onDeleteSignature: (signature: string) => void;
  isDocumentLoaded: boolean;
  isLoading: boolean;
  onAddText: () => void;
}

const SignatureMobile = ({
  callSignatureModal,
  signatures,
  onSelectSignature,
  onDeleteSignature,
  isDocumentLoaded,
  isLoading,
  onAddText,
}: SignatureProps) => {
  return (
    <div className={styles.signature}>
      <Image className={styles.signature__icon} src="/icons/adaptiveMenu.svg" alt="Подпись" width={32} height={32} />
      <Image src="/icons/userIcon.svg" alt="Подпись" width={32} height={32} />
      {/* <div className={styles.signature__actions}>
        <button className={styles.signature__button} onClick={onAddText}>
          <span>Добавить текст</span>
        </button>
        <button
          className={styles.signature__button}
          onClick={callSignatureModal}
        >
          <span>Загрузить подпись</span>
        </button>
      </div> */}
      {/* <ul className={styles.signature__list}>
        {isLoading ? (
          <li>Загрузка...</li>
        ) : (
          Array.isArray(signatures) &&
          signatures.map((sig) => (
            <li className={styles.signature__listItem} key={sig}>
              <div className={styles.signature__itemWrap}>
                <img
                  src={sig}
                  alt="Подпись"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectSignature(sig)}
                />
                <button
                  className={styles.closeButton}
                  onClick={() => onDeleteSignature(sig)}
                  title="Удалить подпись"
                ></button>
              </div>
            </li>
          ))
        )}
      </ul> */}
    </div>
  );
};

export default SignatureMobile;
