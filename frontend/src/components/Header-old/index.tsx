"use client";

import { useEffect, useState, Suspense } from "react";
import st from "./Header.module.scss";
import Modal from "@/shared/Modals/Modals";
import ky from "ky";
import { AuthWidget, Login, YandexAuthButton } from "../Auth/Index";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { LeaveIcon } from "../Icons/Icons";

interface User {
  first_name: string;
  last_name: string;
  email: string;
  ava: string;
}

interface DecodedToken {
  id: string;
}

interface ApiUserResponse {
  last_name: string;
  first_name: string;
  default_email: string;
  id: string;
  picture: string;
}

interface ApiAuthResponse {
  token: string;
  expiresIn: number;
}

export default function Header() {
  const [show, setShow] = useState<boolean>(false);
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (Cookies.get("token")) {
      setShow(false);
    } else {
      setShow(true);
    }
    const request = async () => {
      const id = Cookies.get("id_user");
      if (!id) {
        console.warn("ID пользователя отсутствует в Cookies.");
        return;
      }

      try {
        const getUser = await ky
          .get<User>(
            `https://scan-back-production.up.railway.app/api/user/${id}`,
            {
              headers: {
                Authorization: Cookies.get("token") || "",
              },
            }
          )
          .json();
        setUser(getUser);
        console.log(getUser);
      } catch (error) {
        console.error("Ошибка при запросе данных пользователя:", error);
      }
    };
    request();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");

      if (accessToken) {
        console.log("Токен доступа:", accessToken);

        const fetchUserInfo = async () => {
          try {
            const res = await ky
              .post<ApiUserResponse>(
                "https://scan-back-production.up.railway.app/api/auth/userY",
                {
                  json: { access_token: accessToken },
                }
              )
              .json();

            const resUs = await ky
              .post<ApiAuthResponse>(
                "https://scan-back-production.up.railway.app/api/auth",
                {
                  json: {
                    last_name: res.last_name,
                    first_name: res.first_name,
                    google_id: null,
                    email: res.default_email,
                    vk_id: null,
                    ya_id: res.id,
                    ava: res.picture,
                  },
                }
              )
              .json();

            const user = jwtDecode<DecodedToken>(resUs.token);
            Cookies.set("id_user", user.id);
            Cookies.set("token", resUs.token, {
              expires: resUs.expiresIn,
            });
          } catch (error) {
            console.error("Ошибка запроса:", error);
          } finally {
            window.history.replaceState(null, "", window.location.pathname);
          }
        };
        fetchUserInfo();
      } else {
        console.log("Токен не найден в хэше.");
      }
    } else {
      console.log("Хэш отсутствует в URL.");
    }
  }, []);

  const clearAllCookies = (): void => {
    const allCookies = Cookies.get();

    Object.keys(allCookies).forEach((cookieName) => {
      Cookies.remove(cookieName, { path: "/" });
    });
    window.location.reload();
  };

  return (
    <></>
    // <header className={st.header}>
    //   <h1>Редактор</h1>
    //   <div className={st.header__acc}>
    //     {Cookies.get("token") && (
    //       <img
    //         src={
    //           user?.ava ??
    //           "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    //         }
    //         alt="Аватар"
    //         onClick={() => setShow(true)}
    //       />
    //     )}
    //   </div>
    //   <Modal
    //     isOpen={show}
    //     onClose={() => {
    //       if (Cookies.get("token")) {
    //         setShow(false);
    //       } else {
    //         setShow(true);
    //       }
    //     }}
    //   >
    //     {!Cookies.get("token") ? (
    //       <div className={st.header__social}>
    //         <h1>Войдите в аккаунт</h1>
    //         <Suspense fallback={<p>Загрузка...</p>}>
    //           <Login />
    //           <YandexAuthButton />
    //           <AuthWidget />
    //         </Suspense>
    //       </div>
    //     ) : (
    //       <div className={st.header__profile}>
    //         <div className={st.header__profile_info}>
    //           <img
    //             src={
    //               user?.ava ??
    //               "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    //             }
    //             alt="Аватар"
    //           />
    //           <h4>
    //             {user?.first_name} {user?.last_name}
    //           </h4>
    //         </div>
    //         <div className={st.header__profile_leave}>
    //           <p>
    //             <strong>Email:</strong> {user?.email}
    //           </p>
    //           <p onClick={clearAllCookies}>
    //             <LeaveIcon />
    //           </p>
    //         </div>
    //       </div>
    //     )}
    //   </Modal>
    // </header>
  );
}
