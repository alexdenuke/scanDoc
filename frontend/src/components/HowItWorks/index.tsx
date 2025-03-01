import style from "./HowItWorks.module.scss";
import Image from "next/image";
export default function HowItWorks() {
    return (
        <>
            <h2 className="title">Всего 3 клика</h2>
            <div className={style.stepWrap}>
                <div className={style.step}>
                    <Image className={style.number1} src="/img/stepOne.png"
                        width={50}
                        height={200}
                        alt="Picture of the author" />
                    <div className={style.titleWrap}>
                        <h3 className={style.stepTitle}>Загрузи документ</h3>
                        <p className={style.subtitle}>Подойдет любой формат: PDF, JPEG, Word, Excel или фото с телефона.</p>
                    </div>

                </div>
                <div className={style.step}>
                    <Image className={style.number2} src="/img/stepTwo.png"
                        width={130}
                        height={200}
                        alt="Picture of the author" />
                    <div className={style.titleWrap}>
                        <h3 className={style.stepTitle}>Поставь свою подпись</h3>
                        <p className={style.subtitle}>Выбери место и размер подписи на документе, дальше сервис все сделает сам</p>
                    </div>

                </div>
                <div className={style.step}>
                    <Image className={style.number3} src="/img/stepThree.png"
                        width={130}
                        height={200}
                        alt="Picture of the author" />
                    <div className={style.titleWrap}>
                        <h3 className={style.stepTitle}>Выгрузи готовый документ</h3>
                        <p className={style.subtitle}>В любом удобном формате, с возможностью использования в различных целях.</p>
                    </div>

                </div>
            </div>

        </>
    )
}