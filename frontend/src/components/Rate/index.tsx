"use client";

import BtnWithArrow from "../BtnWithArrow";
import style from "./Rate.module.scss";
import Image from "next/image";
import { useState } from 'react';


export default function Rate() {

    const [imageSrc1, setImageSrc1] = useState("/img/icons/rateDocument.svg");
    const [imageSrc2, setImageSrc2] = useState("/img/icons/rateDocument2.svg");
    const [imageSrc3, setImageSrc3] = useState("/img/icons/rateDocument3.svg");
    return (
        <section className={style.rate}>
            <h2 className="title">Быстрее и дешевле принтера</h2>
            <h3 className="subtitle">Попробуй бесплатно, а дальше выбери нужный тариф под себя</h3>
            <div className={style.selectWrap}>
                <div
                    onMouseEnter={() => setImageSrc1("/img/icons/rateDocumentHover.svg")}
                    onMouseLeave={() => setImageSrc1("/img/icons/rateDocument.svg")}
                    className={style.select}>

                    <Image className={style.image} src={imageSrc1}
                        width={140}
                        height={180}
                        alt="Picture of the author" />
                    <p className={style.selectInfo}>РАЗОВЫЙ</p>
                    <p className={style.selectPrice}>69 руб. / документ</p>
                </div>
                <div
                    onMouseEnter={() => setImageSrc2("/img/icons/rateDocumentHover2.svg")}
                    onMouseLeave={() => setImageSrc2("/img/icons/rateDocument2.svg")}
                    className={style.select}>
                    <Image className={style.image} src={imageSrc2}
                        width={193}
                        height={182}
                        alt="Picture of the author" />
                    <p className={style.selectInfo}>PREMIUM</p>
                    <p className={style.selectPrice}>290 руб. / месяц</p>
                </div>
                <div
                    onMouseEnter={() => setImageSrc3("/img/icons/rateDocumentHover3.svg")}
                    onMouseLeave={() => setImageSrc3("/img/icons/rateDocument3.svg")}
                    className={style.select}>
                    <Image className={style.image} src={imageSrc3}
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