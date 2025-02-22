import BtnWithArrow from "../BtnWithArrow";
import style from "./Rate.module.scss";
import Image from "next/image";


export default function Rate() {
    return (
        <section className={style.rate}>
            <h2 className={style.title}>Быстрее и дешевле принтера</h2>
            <h3 className={style.subtitle}>Попробуй бесплатно, а дальше выбери нужный тариф под себя</h3>
            <div className={style.selectWrap}>
                <div className={style.select}>
                    <Image src="/img/icons/rateDocument.svg"
                        width={140}
                        height={180}
                        alt="Picture of the author" />
                    <p className={style.selectInfo}>РАЗОВЫЙ</p>
                    <p className={style.selectPrice}>69 руб. / документ</p>
                </div>
                <div className={style.select}>
                    <Image src="/img/icons/rateDocument2.svg"
                        width={193}
                        height={182}
                        alt="Picture of the author" />
                    <p className={style.selectInfo}>PREMIUM</p>
                    <p className={style.selectPrice}>290 руб. / месяц</p>
                </div>
                <div className={style.select}>
                    <Image src="/img/icons/rateDocument3.svg"
                        width={246}
                        height={182}
                        alt="Picture of the author" />
                    <p className={style.selectInfo}>ГОДОВОЙ</p>
                    <p className={style.selectPrice}>2990 руб. / год</p>
                </div>
            </div>
            <BtnWithArrow label={"Попробовать бесплатно"} justify={"center"} />
        </section>
    )
}