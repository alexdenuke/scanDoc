import BtnWithArrow from "../BtnWithArrow";
import style from "./Feedback.module.scss";
import Image from "next/image";
export default function Feedback() {
    return (
        <section className={style.feedback}>
            <div className={style.flex}>
                <div className={style.titleWrap}>
                    <h2 className={style.title}>Захотели выкинуть принтеры из офиса и приобрести подписку для своих сотрудников?</h2>
                    <h3 className={style.subtitle}>Оставьте заявку и мы посчитаем для Вас индивидуальный тариф, а также возможность оплаты по счету</h3>
                </div>
                <Image src="/img/feedback.png"
                    width={337}
                    height={232}
                    alt="Picture of the author" />
            </div>
            <form className={style.form} action="">
                <input className={style.input} type="text" placeholder="Имя" />
                <input className={style.input} type="text" placeholder="Телефон" />
                <BtnWithArrow label={"Оставить заявку"} justify={""} />
            </form>

        </section>
    )
}