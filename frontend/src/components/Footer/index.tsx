import style from "./Footer.module.scss";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className={style.footer}>
            <div className="container">
                <div className={style.footerWrap}>
                    <p className={style.logo}>ПодписьОнлайн</p>
                    {/* <nav className={style.nav}>
                        <Link className={style.navLink} href="/">Как работает</Link>
                        <Link className={style.navLink} href="/">Тарифы</Link>
                        <Link className={style.navLink} href="/">Калькуляторы</Link>
                        <Link className={style.navLink} href="/">Примеры документов</Link>
                        <Link className={style.navLink} href="/">Поддержка</Link>
                    </nav> */}
                </div>
                <div className={style.flex}>
                    <p className={style.text}>Подпись и печать на <br /> любом документе в 3 клика</p>
                    <div className="flexCol">
                        <Link className={style.link} href={"/"}>Условия пользования</Link>
                        <Link className={style.link} href={"/"}>Политика кофиденциальности</Link>
                        <p className={style.copyright}>ПодписьОнлайн, 2025</p>
                    </div>
                </div>


            </div>

        </footer>
    )
}