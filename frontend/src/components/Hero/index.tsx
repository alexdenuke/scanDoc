import style from "./Hero.module.scss";
import Link from "next/link";
import Image from "next/image";
import BtnWithArrow from "../BtnWithArrow";

export default function Hero() {
    return (
        <section className={style.hero}>
            <div className={style.hero__titleWrap}>
                <h1 className={style.hero__title}>Подпиши и поставь печать на документы онлайн</h1>
                <h2 className={style.hero__subtitle}>С телефона или компьютера. Для личных целей или на работе. Без лишних телодвижений</h2>
                {/* <Link className="hero__btnLink" href="/">
            <button className={style.hero__btn}>Поставить подпись</button>
            <Image className={style.heroArrow} src="/icons/arrow.svg" width={50} height={50} alt="" />
            </Link> */}
                <BtnWithArrow justify="start" label="Поставить подпись" />

            </div>
            {/* <div className={style.hero__imgWrap}>
            <img src="/img/hero_img.svg" alt="" className={style.hero__img} />
        </div> */}
        </section>
    )
}