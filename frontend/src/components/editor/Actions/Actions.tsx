import React, { useState } from "react";
import {
  AllPagesIcon,
  CancelIcon,
  DownloadIcon,
  MoreIcon,
  RotatePageIcon,
  TrashIcon,
} from "@/components/Icons/Icons";
import styles from "./Actions.module.scss";
import ActionsMobile from "@/components/Mobile/Actions/Index";
import DownlaodMobile from "@/components/Mobile/Download/Index";
import Image from "next/image";
import Popup from "@/components/Popup";

interface ActionsProps {
  onDeleteDocument: () => void;
  onUndo: () => void;
  onRotate: () => void;
  onApplyToAll: () => void;
  isDocumentLoaded: boolean;
  isApplyAllEnabled: boolean;
  onExportJPG: () => void;
  onExportPDF: () => void;
}

const Actions: React.FC<ActionsProps> = ({
  onDeleteDocument,
  onUndo,
  onRotate,
  onApplyToAll,
  isDocumentLoaded,
  isApplyAllEnabled,
  onExportJPG,
  onExportPDF,
}) => {
  const [showActions, setShowActions] = useState<boolean>(false);
  const [showDownload, setShowDownload] = useState<boolean>(false);

  const [isOpen, setIsOpen] = useState(false);

  const [isOPenPayment, setIsOpenPayment] = useState(false);

  return (

    <>
      <div className={styles.adaptive}>
        <Image src="/icons/adaptivePlus.svg" alt="Удалить документ" width={31} height={31} />
        <Image src="/icons/adaptiveArrowLeft.svg" alt="Удалить документ" width={31} height={31} />
        <p>1/20</p>
        <Image src="/icons/adaptiveArrowRight.svg" alt="Удалить документ" width={31} height={31} />
        <Image onClick={() => setIsOpen(true)} src="/icons/adaptiveDownload.svg" alt="Удалить документ" width={31} height={31} />
        <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className={styles.popup}>
            <p className={styles.popup__title}>Чтобы выгрузить документ придется немного заплатить</p>
            <div className={styles.popup__tariff}>
              <div className={styles.popup__tariffWrap}>
                <Image src={"/img/icons/rateDocument.svg"} alt="тариф" width={123} height={150} />
                <div className={styles.popup__tariffPriceWrap}>
                  <p className={styles.popup__tariffPrice}>69 &#8381;</p>
                  <p className="popup__tariffInfo">Один документ</p>
                </div>
              </div>
              <div className={styles.popup__tariffWrap}>
                <Image src={"/img/icons/rateDocument2.svg"} alt="тариф" width={166} height={150} />
                <div className={styles.popup__tariffPriceWrap}>
                  <p className={styles.popup__tariffPrice}>290 &#8381;</p>
                  <p className="popup__tariffInfo">Безлимит на месяц</p>
                </div>
              </div>
              <div className={styles.popup__tariffWrap}>
                <Image src={"/img/icons/rateDocument3.svg"} alt="тариф" width={204} height={150} />
                <div className={styles.popup__tariffPriceWrap}>
                  <p className={styles.popup__tariffPrice}>2990 &#8381;</p>
                  <p className="popup__tariffInfo">безлимит на год</p>
                </div>
              </div>
            </div>
            <div className={styles.popup__payment}>
              <input type="text" placeholder="Промокод" className={styles.popup__paymentInput} />
              <button className={styles.popup__paymentActivate}>Активировать</button>
              <button onClick={() => setIsOpenPayment(true)} className={styles.popup__paymentBtn}>Оплатить</button>
            </div>
          </div>

        </Popup>

        <Popup isOpen={isOPenPayment} onClose={() => setIsOpenPayment(false)}>
          <div className={styles.payment}>
            <div className={styles.user}>
              <div className={styles.iconWrap}>
                <Image src={"/icons/userIcon.svg"} alt="Image" width={67} height={92} />
                <div className={styles.userInfo}>
                  <p className={styles.usernameTitle}>Username</p>
                  <p className={styles.userName}>Иванов Иван</p>
                  <p className={styles.eMailTitle}>E-mail</p>
                  <p className={styles.eMail}>Example@mail.ru</p>
                </div>
              </div>
              <p className={styles.authorization}>Авторизация через:</p>
              <div className={styles.socials}>
                <Image className={styles.socialIcon} src={"/icons/g.svg"} alt="Image" width={30} height={31} />
                <Image className={styles.socialIcon} src={"/icons/faceBook.svg"} alt="Image" width={30} height={31} />
                <Image className={styles.socialIcon} src={"/icons/vk.svg"} alt="Image" width={30} height={31} />
              </div>
              <p className={styles.terms}>Ты используешь бесплатную версию сервиса. Для снятия ограничений приобрети подписку. <span className={styles.textColor}>Конфиденциальность</span> и <span className={styles.textColor}>условия пользования</span> </p>
            </div>
            <div className={styles.pay}>
              <p className={styles.payTitle}>Подключи безлимит за 290 ₽ в месяц</p>
              <p className={styles.paySubtitle}>Любое количество страниц</p>
              <p className={styles.paySubtitle}>Подпись и печать в любом месте</p>
              <p className={styles.paySubtitle}>Сохранение в PDF и JPG</p>

              <button className={styles.payBtn}>Оплатить 290 &#8381;</button>
            </div>
          </div>
        </Popup>
      </div>
      <div className={styles.actions}>
        {showActions && (
          <ActionsMobile
            onDeleteDocument={onDeleteDocument}
            onUndo={onUndo}
            onRotate={onRotate}
            onApplyToAll={onApplyToAll}
            isDocumentLoaded={isDocumentLoaded}
          />
        )}
        {showDownload && (
          <DownlaodMobile onExportJPG={onExportJPG} onExportPDF={onExportPDF} />
        )}
        <div className={styles.actions__content}>
          <button
            className={styles.actions__button}
            onClick={onDeleteDocument}
            disabled={!isDocumentLoaded}
            title={
              !isDocumentLoaded
                ? "Загрузите документ для удаления"
                : "Удалить документ"
            }
          >
            <Image src="/icons/trashIcon.svg" alt="Удалить документ" width={22} height={22} />
            <span>Удалить документ</span>
          </button>
          <button
            className={styles.actions__button}
            onClick={onUndo}
            disabled={!isDocumentLoaded}
            title={
              !isDocumentLoaded ? "Загрузите документ для отмены" : "Отменить"
            }
          >
            <Image src="/icons/cancelIcon.svg" alt="Отменить" width={22} height={22} />
            <span>Отменить</span>
          </button>
          <button
            className={styles.actions__button}
            onClick={onRotate}
            disabled={!isDocumentLoaded}
            title={
              !isDocumentLoaded
                ? "Загрузите документ для поворота"
                : "Повернуть страницу"
            }
          >
            <Image src="/icons/rotateIcon.svg" alt="Повернуть страницу" width={22} height={22} />
            <span>Повернуть страницу</span>
          </button>
          <button
            className={styles.actions__button}
            onClick={onApplyToAll}
            disabled={!isDocumentLoaded || !isApplyAllEnabled}
            title={
              !isDocumentLoaded
                ? "Загрузите документ для применения"
                : !isApplyAllEnabled
                  ? "Выберите элемент для применения"
                  : "Применить на все страницы"
            }
          >
            <Image src="/icons/documentsIcon.svg" alt="Применить на все страницы" width={22} height={22} />
            <span>На все страницы</span>
          </button>
        </div>

        <div className={styles.actions__export}>

          <span className={styles.actions__exportText}>Скачать бесплатно:</span>
          <div className={styles.actions__exportButtons}>
            <button

              // onClick={() => alert("Кнопка нажата!")}
              className={styles.actions__downloadButton}
              // disabled={!isDocumentLoaded}
              title={
                !isDocumentLoaded
                  ? "Загрузите документ для экспорта!!"
                  : "Экспортировать в JPG!"
              }
            // onClick={onExportJPG}
            >
              <Image className="actions__downloadIcon" src="/icons/download.svg" alt="logo" width={15} height={15} />
              <span className={styles.actions__downloadText}>JPG</span>

            </button>


            <button
              className={styles.actions__downloadButton}
              disabled={!isDocumentLoaded}
              title={
                !isDocumentLoaded
                  ? "Загрузите документ для экспорта!!"
                  : "Экспортировать в JPG!"
              }

            // onClick={onExportJPG}
            >
              <Image className="actions__downloadIcon" src="/icons/download.svg" alt="logo" width={15} height={15} />
              <span className={styles.actions__downloadText}>PDF</span>
            </button>
          </div>
          <span className={styles.actions__exportText}>Купить:</span>
          <div className={styles.actions__exportButtons}>
            <button
              onClick={() => setIsOpen(true)}
              className={styles.actions__exportButton}
              // disabled={!isDocumentLoaded}
              title={
                !isDocumentLoaded
                  ? "Загрузите документ для экспорта!!"
                  : "Экспортировать в JPG!"
              }
            // onClick={onExportJPG}
            >
              <DownloadIcon />
              <span>JPG</span>
            </button>
            <button
              className={styles.actions__exportButton}
              onClick={() => setIsOpen(true)}
              // disabled={!isDocumentLoaded}
              title={
                !isDocumentLoaded
                  ? "Загрузите документ для экспорта"
                  : "Экспортировать в PDF"
              }
            // onClick={onExportPDF}
            >
              <DownloadIcon />
              <span>PDF</span>
            </button>
            <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <div className={styles.popup}>
                <p className={styles.popup__title}>Чтобы выгрузить документ придется немного заплатить</p>
                <div className={styles.popup__tariff}>
                  <div className={styles.popup__tariffWrap}>
                    <Image src={"/img/icons/rateDocument.svg"} alt="тариф" width={123} height={150} />
                    <div className={styles.popup__tariffPriceWrap}>
                      <p className={styles.popup__tariffPrice}>69 &#8381;</p>
                      <p className="popup__tariffInfo">Один документ</p>
                    </div>
                  </div>
                  <div className={styles.popup__tariffWrap}>
                    <Image src={"/img/icons/rateDocument2.svg"} alt="тариф" width={166} height={150} />
                    <div className={styles.popup__tariffPriceWrap}>
                      <p className={styles.popup__tariffPrice}>290 &#8381;</p>
                      <p className="popup__tariffInfo">Безлимит на месяц</p>
                    </div>
                  </div>
                  <div className={styles.popup__tariffWrap}>
                    <Image src={"/img/icons/rateDocument3.svg"} alt="тариф" width={204} height={150} />
                    <div className={styles.popup__tariffPriceWrap}>
                      <p className={styles.popup__tariffPrice}>2990 &#8381;</p>
                      <p className="popup__tariffInfo">безлимит на год</p>
                    </div>
                  </div>
                </div>
                <div className={styles.popup__payment}>
                  <input type="text" placeholder="Промокод" className={styles.popup__paymentInput} />
                  <button className={styles.popup__paymentActivate}>Активировать</button>
                  <button onClick={() => setIsOpenPayment(true)} className={styles.popup__paymentBtn}>Оплатить</button>
                </div>
              </div>
            </Popup>

            <Popup isOpen={isOPenPayment} onClose={() => setIsOpenPayment(false)}>
              <div className={styles.payment}>
                <div className={styles.user}>
                  <div className={styles.iconWrap}>
                    <Image src={"/icons/userIcon.svg"} alt="Image" width={67} height={92} />
                    <div className={styles.userInfo}>
                      <p className={styles.usernameTitle}>Username</p>
                      <p className={styles.userName}>Иванов Иван</p>
                      <p className={styles.eMailTitle}>E-mail</p>
                      <p className={styles.eMail}>Example@mail.ru</p>
                    </div>
                  </div>
                  <p className={styles.authorization}>Авторизация через:</p>
                  <div className={styles.socials}>
                    <Image className={styles.socialIcon} src={"/icons/g.svg"} alt="Image" width={30} height={31} />
                    <Image className={styles.socialIcon} src={"/icons/faceBook.svg"} alt="Image" width={30} height={31} />
                    <Image className={styles.socialIcon} src={"/icons/vk.svg"} alt="Image" width={30} height={31} />
                  </div>
                  <p className={styles.terms}>Ты используешь бесплатную версию сервиса. Для снятия ограничений приобрети подписку. <span className={styles.textColor}>Конфиденциальность</span> и <span className={styles.textColor}>условия пользования</span> </p>
                </div>
                <div className={styles.pay}>
                  <p className={styles.payTitle}>Подключи безлимит за 290 ₽ в месяц</p>
                  <p className={styles.paySubtitle}>Любое количество страниц</p>
                  <p className={styles.paySubtitle}>Подпись и печать в любом месте</p>
                  <p className={styles.paySubtitle}>Сохранение в PDF и JPG</p>

                  <button className={styles.payBtn}>Оплатить 290 &#8381;</button>
                </div>
              </div>
            </Popup>
          </div>
        </div>
      </div>
    </>

  );
};

export default Actions;
