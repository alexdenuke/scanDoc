import style from "./Hero.module.scss";
import Link from "next/link";
import Image from "next/image";
import BtnWithArrow from "../BtnWithArrow";

export default function Hero() {
    return (
        <section className={style.hero}>
            <div className={style.hero__titleWrap}>
                <h1 className={`title ${style.heroTitle}`}>Подпиши и поставь печать на документы онлайн</h1>
                <div className={style.background}>
                    <h2 className={`subtitle ${style.heroSubtitle}`}>С телефона или компьютера. Для личных целей или на работе. Без лишних телодвижений</h2>
                    <BtnWithArrow justify="start" label="Поставить подпись" />
                </div>
            </div>
            <Image className={style.heroImg} src="/img/hero_img.svg"
                width={608}
                height={564}
                alt="Picture" />
        </section >
    )
}