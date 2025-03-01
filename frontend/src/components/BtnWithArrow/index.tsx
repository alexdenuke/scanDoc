import style from "./BtnWithArrow.module.scss";
import classNames from "classnames";
import Link from "next/link";

interface ButtonProps {
    label: string,
    justify: string,

}

export default function BtnWithArrow({ label, justify }: ButtonProps) {
    return (
        <div
            style={{
                justifyContent: justify, // ✅ Передаём `justify-content` как inline-стиль
            }}
            className={style.btnWrap}>
            <Link href={"/editor"}>
                <button className={style.btn}>{label}</button>
            </Link>

        </div>



    )
}