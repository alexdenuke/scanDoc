import HomeComponents from "@/components/HomeComponents";
import Header from "@/components/Header"
import Hero from "@/components/Hero"
import BtnWithArrow from "@/components/BtnWithArrow";
import HowItWorks from "@/components/HowItWorks";
import style from "./page.module.scss"
import WhyUs from "@/components/WhyUs";
import Example from "@/components/Example";
import Rate from "@/components/Rate";
import Feedback from "@/components/Feedback";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="container">
        <Header />
        <Hero />
        <HowItWorks />
        {/* <section className={style.fastAndSafe}>
          <h2 className={style.title}>Быстро и безопасно</h2>
          <BtnWithArrow justify="center" label="Загрузить документ" />
        </section> */}
        <WhyUs />
      </div>
      <Example />
      <div className="container">
        <Rate />
        <Feedback />
      </div>
      <Footer />



    </>
  );
}
