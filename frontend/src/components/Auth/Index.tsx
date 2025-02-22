/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, useState } from "react";
import ky from "ky";
import Cookies from "js-cookie";
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface Payload {
  code: string;
  device_id: string;
}

interface VKIDType {
  Config: any;
  ConfigResponseMode: any;
  ConfigSource: any;
  Auth: {
    exchangeCode: (code: string, deviceId: string) => Promise<AuthData>;
  };
  OAuthList: {
    render: (options: OAuthRenderOptions) => OAuthListInstance;
  };
  WidgetEvents: Record<string, string>;
  OAuthListInternalEvents: Record<string, string>;
}

interface AuthData {
  access_token: string;
}

interface OAuthRenderOptions {
  container: HTMLDivElement | null;
  styles: Record<string, string | number>;
  oauthList: string[];
}

interface OAuthListInstance {
  on: (
    event: string,
    callback: (payload: Payload) => void
  ) => OAuthListInstance;
}

interface CustomJwtPayload extends JwtPayload {
  family_name: string;
  given_name: string;
  sub: string;
  email: string;
  picture: string;
}

interface ApiUserResponse {
  user: {
    last_name: string;
    first_name: string;
    email: string;
    user_id: string;
  };
  avatar: string;
}

interface ApiAuthResponse {
  token: string;
  expiresIn: number;
}

interface AuthData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token: string;
}

export const AuthWidget: React.FC = () => {
  const widgetContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadVKID = () => {
      if ("VKIDSDK" in window) {
        const VKID = (window as any).VKIDSDK;

        VKID.Config.init({
          app: 52801973,
          redirectUrl: "https://scan-production-4754.up.railway.app",
          responseMode: VKID.ConfigResponseMode.Callback,
          source: VKID.ConfigSource.LOWCODE,
          scope: "email", // Укажите доступы по необходимости
        });

        const oAuth = new VKID.OAuthList();

        oAuth
          .render({
            container: widgetContainer.current,
            oauthList: ["vkid", "mail_ru", "ok_ru"],
          })
          .on(VKID.WidgetEvents.ERROR, vkidOnError)
          .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, (payload: any) => {
            const code = payload.code;
            const deviceId = payload.device_id;

            VKID.Auth.exchangeCode(code, deviceId)
              .then(vkidOnSuccess)
              .catch(vkidOnError);
          });
      }
    };

    const vkidOnSuccess = (data: AuthData) => {
      console.log("Успешная авторизация:", data);

      const fetchUserInfo = async (data: AuthData) => {
        try {
          const userInfo: ApiUserResponse = await ky
            .post(
              "https://scan-back-production.up.railway.app/api/auth/userVk",
              {
                json: {
                  access_token: data.access_token,
                },
              }
            )
            .json();

          const res: ApiAuthResponse = await ky
            .post("https://scan-back-production.up.railway.app/api/auth", {
              json: {
                last_name: userInfo.user.last_name,
                first_name: userInfo.user.first_name,
                google_id: null,
                email: userInfo.user.email,
                vk_id: userInfo.user.user_id,
                ya_id: null,
                ava: userInfo.avatar,
              },
            })
            .json();
          console.log(userInfo);

          if (!res.token) {
            throw new Error("Токен не получен от сервера.");
          }

          Cookies.set("token", res.token, { expires: res.expiresIn || 1 });

          const user = jwtDecode<{ id: string }>(res.token);
          Cookies.set("id_user", user.id);
          window.location.reload();
        } catch (error) {
          console.error("Ошибка запроса к VK API:", error);
        }
      };
      fetchUserInfo(data);
    };

    const vkidOnError = (error: any) => {
      console.error("Ошибка авторизации:", error);
    };

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
    script.async = true;
    script.onload = loadVKID;
    document.body.appendChild(script);

    return () => {
      if (widgetContainer.current) {
        widgetContainer.current.innerHTML = "";
      }
      const vkidScript = document.querySelector(
        `script[src="https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js"]`
      );
      if (vkidScript) {
        document.body.removeChild(vkidScript);
      }
    };
  }, []);

  return (
    <div>
      <div ref={widgetContainer}></div>
    </div>
  );
};

export const YandexAuthButton: React.FC = () => {
  const handleLogin = () => {
    const clientId = "2e69cda7a02149fb95a60c2536e052f4";
    const redirectUri = "https://scan-production-4754.up.railway.app";
    const authUrl = `https://oauth.yandex.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleLogin}>
      <img
        width={50}
        height={50}
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Yandex_icon.svg/1200px-Yandex_icon.svg.png"
        alt="Yandex OAuth"
      />
    </button>
  );
};

export function Login() {
  const handleSuccess = async (response: { credential?: string }) => {
    try {
      if (!response.credential) {
        throw new Error("Credential отсутствует в ответе Google.");
      }

      const userObject = jwtDecode<CustomJwtPayload>(response.credential);

      const res: ApiAuthResponse = await ky
        .post("https://scan-back-production.up.railway.app/api/auth", {
          json: {
            last_name: userObject.family_name,
            first_name: userObject.given_name,
            google_id: userObject.sub,
            email: userObject.email,
            vk_id: null,
            ya_id: null,
            ava: userObject.picture,
          },
        })
        .json();

      Cookies.set("token", res.token, { expires: res.expiresIn });
      const user = jwtDecode<{ id: string }>(res.token);
      Cookies.set("id_user", user.id);
      window.location.reload();
    } catch (error) {
      console.error("Ошибка авторизации через Google:", error);
    }
  };

  const handleError = () => {
    console.error("Ошибка при входе через Google");
  };

  return (
    <GoogleLogin
      shape="circle"
      containerProps={{
        style: {
          display: "flex",
          justifyContent: "center",
          width: "100%",
        },
      }}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
