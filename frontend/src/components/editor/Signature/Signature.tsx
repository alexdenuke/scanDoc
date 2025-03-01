import SignatureMobile from "@/components/Mobile/Signature/Index";
import styles from "./Signature.module.scss";
import { TextIcon, UploadIcon } from "@/components/Icons/Icons";

interface SignatureProps {
  callSignatureModal: () => void;
  signatures: string[];
  onSelectSignature: (signature: string) => void;
  onDeleteSignature: (signature: string) => void;
  isDocumentLoaded: boolean;
  isLoading: boolean;
  onAddText: () => void;
}

const Signature: React.FC<SignatureProps> = ({
  callSignatureModal,
  signatures,
  onSelectSignature,
  onDeleteSignature,
  isDocumentLoaded,
  isLoading,
  onAddText,
}) => {
  return (
    <>
      <SignatureMobile
        callSignatureModal={callSignatureModal}
        signatures={signatures}
        onSelectSignature={onSelectSignature}
        onDeleteSignature={onDeleteSignature}
        isLoading={isLoading}
        onAddText={onAddText}
        isDocumentLoaded={isDocumentLoaded}
      />
      <div className={styles.signature}>
        <div className={styles.signature__actions}>
          <button className={styles.signature__button} onClick={onAddText}>
            <TextIcon />
            <span>Добавить текст</span>
          </button>
          <button
            className={styles.signature__button}
            onClick={callSignatureModal}
          >
            <UploadIcon />
            <span>Загрузить подпись</span>
          </button>
        </div>
        <ul className={styles.signature__list}>
          {isLoading ? (
            <li>Загрузка...</li>
          ) : (
            Array.isArray(signatures) &&
            signatures.map((sig) => (
              <li className={styles.signature__listItem} key={sig}>
                <div className={styles.signature__listWrap}>
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
        </ul>
      </div>
    </>
  );
};

export default Signature;
