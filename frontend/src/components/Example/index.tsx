import style from "./Example.module.scss";
import Image from "next/image";

export default function Example() {
    return (
        <section className={style.example}>

            <h2 className={style.title}>Примеры документов</h2>
            <div className={style.imgWrap}>
                <Image className={style.img} src="/img/doc1.png"
                    width={205}
                    height={289}
                    // fill={true}
                    alt="Picture of the author" />
                <Image className={style.img} src="/img/doc2.png"
                    width={228}
                    height={326}
                    // fill={true}
                    alt="Picture of the author" />
                <Image className={style.img} src="/img/doc3.png"
                    width={263}
                    height={372}
                    // fill={true}
                    alt="Picture of the author" />
                <Image className={style.img} src="/img/doc4.png"
                    width={290}
                    height={186}
                    // fill={true}
                    alt="Picture of the author" />
                <Image className={style.img} src="/img/doc5.png"
                    width={224}
                    height={289}
                    // fill={true}
                    alt="Picture of the author" />
            </div>
            <div></div>
        </section>
    )
}