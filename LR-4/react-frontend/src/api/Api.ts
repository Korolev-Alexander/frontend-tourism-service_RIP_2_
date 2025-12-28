/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ErrorResponse {
  /** @example "Authentication required" */
  error?: string;
  /** @example "User authentication failed" */
  message?: string;
}

export interface LoginRequest {
  /** @example "client1" */
  username: string;
  /** @example "pass123" */
  password: string;
}

export interface LoginResponse {
  /** @example true */
  success?: boolean;
  user?: {
    /** @example 1 */
    id?: number;
    /** @example "client1" */
    username?: string;
    /** @example false */
    is_moderator?: boolean;
  };
  /** @example "Login successful" */
  message?: string;
}

export interface Client {
  /** @example 1 */
  id?: number;
  /** @example "client1" */
  username?: string;
  /** @example false */
  is_moderator?: boolean;
  /** @example true */
  is_active?: boolean;
}

export interface SmartDevice {
  /** @example 1 */
  id?: number;
  /** @example "Хаб" */
  name?: string;
  /** @example "Яндекс Хаб" */
  model?: string;
  /**
   * @format float
   * @example 5120
   */
  avg_data_rate?: number;
  /**
   * @format float
   * @example 56.25
   */
  data_per_hour?: number;
  /** @example "http://localhost:9000/image/hub.png" */
  namespace_url?: string;
  /** @example "Умный пульт Яндекс Хаб для устройств" */
  description?: string;
  /** @example "Умный пульт Яндекс Хаб для управления всеми устройствами умного дома..." */
  description_all?: string;
  /** @example "Wi-Fi" */
  protocol?: string;
  /** @example true */
  is_active?: boolean;
  /**
   * @format date-time
   * @example "2025-10-21T13:08:04Z"
   */
  created_at?: string;
}

export interface SmartDeviceCreate {
  /** @example "Хаб" */
  name: string;
  /** @example "Яндекс Хаб" */
  model?: string;
  /**
   * @format float
   * @example 5120
   */
  avg_data_rate?: number;
  /**
   * @format float
   * @example 56.25
   */
  data_per_hour?: number;
  /** @example "http://localhost:9000/image/hub.png" */
  namespace_url?: string;
  /** @example "Умный пульт Яндекс Хаб для устройств" */
  description?: string;
  /** @example "Умный пульт Яндекс Хаб для управления всеми устройствами умного дома..." */
  description_all?: string;
  /** @example "Wi-Fi" */
  protocol?: string;
}

export interface SmartOrder {
  /** @example 1 */
  id?: number;
  /** @example "formed" */
  status?: "draft" | "formed" | "completed" | "rejected" | "deleted";
  /** @example "ул. Примерная, д. 1, кв. 5" */
  address?: string;
  /**
   * @format float
   * @example 0.55
   */
  total_traffic?: number;
  /** @example 1 */
  client_id?: number;
  /** @example "client1" */
  client_name?: string;
  /**
   * @format date-time
   * @example "2025-10-21T13:13:40Z"
   */
  formed_at?: string;
  /**
   * @format date-time
   * @example "2025-10-21T13:14:20Z"
   */
  completed_at?: string;
  /** @example 2 */
  moderator_id?: number;
  /** @example "moderator1" */
  moderator_name?: string;
  /**
   * @format date-time
   * @example "2025-10-21T13:08:04Z"
   */
  created_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  /** @example 2 */
  device_id?: number;
  /** @example "Лампочка" */
  device_name?: string;
  /** @example 3 */
  quantity?: number;
  /**
   * @format float
   * @example 0.5
   */
  data_per_hour?: number;
  /** @example "http://localhost:9000/image/lamp.png" */
  namespace_url?: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Smart Devices API
 * @version 1.0.0
 * @baseUrl http://localhost:8080/api
 * @contact API Support <support@smartdevices.com>
 *
 * # API для системы управления заявками на умные устройства
 *
 * ## Описание
 * Система позволяет клиентам создавать заявки на установку умных устройств,
 * а модераторам - управлять этими заявками.
 *
 * ## Аутентификация
 * - Аутентификация через сессии и куки
 * - Сессии хранятся в Redis
 * - Без авторизации доступны только методы чтения
 *
 * ## Права доступа
 * - **Гость**: Только GET методы (чтение)
 * - **Клиент**: Свои заявки + чтение
 * - **Модератор**: Все методы
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * @description Вход в систему с получением сессии
     *
     * @tags Auth
     * @name LoginCreate
     * @summary Аутентификация пользователя
     * @request POST:/auth/login
     */
    loginCreate: (data: LoginRequest, params: RequestParams = {}) =>
      this.request<LoginResponse, ErrorResponse>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Завершение сессии пользователя
     *
     * @tags Auth
     * @name LogoutCreate
     * @summary Выход из системы
     * @request POST:/auth/logout
     */
    logoutCreate: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Logout successful" */
          message?: string;
        },
        any
      >({
        path: `/auth/logout`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Получение данных текущего пользователя
     *
     * @tags Auth
     * @name SessionList
     * @summary Информация о текущей сессии
     * @request GET:/auth/session
     * @secure
     */
    sessionList: (params: RequestParams = {}) =>
      this.request<
        {
          user?: Client;
        },
        void
      >({
        path: `/auth/session`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Получение списка всех активных сессий (только для модераторов)
     *
     * @tags Auth
     * @name SessionsList
     * @summary Все активные сессии
     * @request GET:/auth/sessions
     * @secure
     */
    sessionsList: (params: RequestParams = {}) =>
      this.request<
        {
          sessions?: Record<string, Client>;
        },
        void
      >({
        path: `/auth/sessions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  smartDevices = {
    /**
     * @description Возвращает список всех активных умных устройств. **Доступно без авторизации**
     *
     * @tags Devices
     * @name SmartDevicesList
     * @summary Получить список умных устройств
     * @request GET:/smart-devices
     */
    smartDevicesList: (
      query?: {
        /**
         * Поиск по названию или описанию
         * @example "лампа"
         */
        search?: string;
        /**
         * Фильтр по протоколу
         * @example "Wi-Fi"
         */
        protocol?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SmartDevice[], any>({
        path: `/smart-devices`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Создание нового умного устройства. **Требует прав модератора**
     *
     * @tags Devices
     * @name SmartDevicesCreate
     * @summary Создать новое устройство
     * @request POST:/smart-devices
     * @secure
     */
    smartDevicesCreate: (data: SmartDeviceCreate, params: RequestParams = {}) =>
      this.request<SmartDevice, void>({
        path: `/smart-devices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Возвращает детальную информацию об умном устройстве. **Доступно без авторизации**
     *
     * @tags Devices
     * @name SmartDevicesDetail
     * @summary Получить устройство по ID
     * @request GET:/smart-devices/{id}
     */
    smartDevicesDetail: (id: number, params: RequestParams = {}) =>
      this.request<SmartDevice, void>({
        path: `/smart-devices/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Обновление данных умного устройства. **Требует прав модератора**
     *
     * @tags Devices
     * @name SmartDevicesUpdate
     * @summary Обновить устройство
     * @request PUT:/smart-devices/{id}
     * @secure
     */
    smartDevicesUpdate: (
      id: number,
      data: SmartDeviceCreate,
      params: RequestParams = {},
    ) =>
      this.request<SmartDevice, void>({
        path: `/smart-devices/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Удаление (деактивация) умного устройства. **Требует прав модератора**
     *
     * @tags Devices
     * @name SmartDevicesDelete
     * @summary Удалить устройство
     * @request DELETE:/smart-devices/{id}
     * @secure
     */
    smartDevicesDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/smart-devices/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Загрузка изображения для умного устройства. **Требует прав модератора**
     *
     * @tags Devices
     * @name ImageCreate
     * @summary Загрузить изображение устройства
     * @request POST:/smart-devices/{id}/image
     * @secure
     */
    imageCreate: (
      id: number,
      data: {
        /**
         * Файл изображения
         * @format binary
         */
        image?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/smart-devices/${id}/image`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * @description Удаление изображения умного устройства. **Требует прав модератора**
     *
     * @tags Devices
     * @name ImageDelete
     * @summary Удалить изображение устройства
     * @request DELETE:/smart-devices/{id}/image
     * @secure
     */
    imageDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/smart-devices/${id}/image`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  smartOrders = {
    /**
     * @description Получение текущей корзины (черновой заявки) пользователя
     *
     * @tags Orders
     * @name CartList
     * @summary Получить корзину пользователя
     * @request GET:/smart-orders/cart
     * @secure
     */
    cartList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example 2 */
          order_id?: number;
          /** @example 1 */
          count?: number;
        },
        void
      >({
        path: `/smart-orders/cart`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Получение списка заявок. - **Клиенты** видят только свои заявки - **Модераторы** видят все заявки (кроме черновиков и удаленных)
     *
     * @tags Orders
     * @name SmartOrdersList
     * @summary Получить список заявок
     * @request GET:/smart-orders
     * @secure
     */
    smartOrdersList: (
      query?: {
        /**
         * Фильтр по статусу
         * @example "formed"
         */
        status?: "draft" | "formed" | "completed" | "rejected";
        /**
         * Дата от (YYYY-MM-DD)
         * @format date
         * @example "2025-10-01"
         */
        date_from?: string;
        /**
         * Дата до (YYYY-MM-DD)
         * @format date
         * @example "2025-10-31"
         */
        date_to?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SmartOrder[], void>({
        path: `/smart-orders`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Получение детальной информации о заявке
     *
     * @tags Orders
     * @name SmartOrdersDetail
     * @summary Получить заявку по ID
     * @request GET:/smart-orders/{id}
     * @secure
     */
    smartOrdersDetail: (id: number, params: RequestParams = {}) =>
      this.request<SmartOrder, void>({
        path: `/smart-orders/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Обновление данных заявки (адрес)
     *
     * @tags Orders
     * @name SmartOrdersUpdate
     * @summary Обновить заявку
     * @request PUT:/smart-orders/{id}
     * @secure
     */
    smartOrdersUpdate: (
      id: number,
      data: {
        /** @example "ул. Новая, д. 10, кв. 25" */
        address?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<SmartOrder, void>({
        path: `/smart-orders/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Удаление заявки (изменение статуса на 'deleted')
     *
     * @tags Orders
     * @name SmartOrdersDelete
     * @summary Удалить заявку
     * @request DELETE:/smart-orders/{id}
     * @secure
     */
    smartOrdersDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/smart-orders/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * @description Перевод заявки из статуса 'draft' в 'formed'
     *
     * @tags Orders
     * @name FormUpdate
     * @summary Сформировать заявку
     * @request PUT:/smart-orders/{id}/form
     * @secure
     */
    formUpdate: (id: number, params: RequestParams = {}) =>
      this.request<SmartOrder, void>({
        path: `/smart-orders/${id}/form`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Завершение заявки модератором. **Требует прав модератора**
     *
     * @tags Orders
     * @name CompleteUpdate
     * @summary Завершить заявку
     * @request PUT:/smart-orders/{id}/complete
     * @secure
     */
    completeUpdate: (id: number, params: RequestParams = {}) =>
      this.request<SmartOrder, void>({
        path: `/smart-orders/${id}/complete`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  orderItems = {
    /**
     * @description Изменение количества устройства в текущем расчете трафика пользователя
     *
     * @tags OrderItems
     * @name OrderItemsUpdate
     * @summary Изменить количество устройства в расчете
     * @request PUT:/calculation-items/{deviceId}
     * @secure
     */
    orderItemsUpdate: (
      deviceId: number,
      data: {
        /** @example 3 */
        quantity?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example 1 */
          device_id?: number;
          /** @example 3 */
          quantity?: number;
          /** @example true */
          updated?: boolean;
        },
        void
      >({
        path: `/calculation-items/${deviceId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Удаление устройства из текущего расчета трафика пользователя
     *
     * @tags OrderItems
     * @name OrderItemsDelete
     * @summary Удалить устройство из расчета
     * @request DELETE:/calculation-items/{deviceId}
     * @secure
     */
    orderItemsDelete: (deviceId: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/calculation-items/${deviceId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  clients = {
    /**
     * @description Получение списка всех клиентов. **Требует прав модератора**
     *
     * @tags Clients
     * @name ClientsList
     * @summary Получить список клиентов
     * @request GET:/clients
     * @secure
     */
    clientsList: (params: RequestParams = {}) =>
      this.request<Client[], void>({
        path: `/clients`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Получение данных клиента. **Требует прав модератора**
     *
     * @tags Clients
     * @name ClientsDetail
     * @summary Получить клиента по ID
     * @request GET:/clients/{id}
     * @secure
     */
    clientsDetail: (id: number, params: RequestParams = {}) =>
      this.request<Client, void>({
        path: `/clients/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Создание нового клиента. **Доступно без авторизации**
     *
     * @tags Clients
     * @name RegisterCreate
     * @summary Регистрация клиента
     * @request POST:/clients/register
     */
    registerCreate: (
      data: {
        /** @example "newclient" */
        username: string;
        /** @example "newpass123" */
        password: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Client, any>({
        path: `/clients/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Обновление данных текущего пользователя
     *
     * @tags Clients
     * @name UpdateUpdate
     * @summary Обновить данные клиента
     * @request PUT:/clients/update
     * @secure
     */
    updateUpdate: (
      data: {
        /** @example 1 */
        id?: number;
        /** @example "updated_client" */
        username?: string;
        /** @example "newpassword" */
        password?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Client, void>({
        path: `/clients/update`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Устаревший метод аутентификации. Используйте /auth/login
     *
     * @tags Clients
     * @name LoginCreate
     * @summary Аутентификация клиента (legacy)
     * @request POST:/clients/login
     */
    loginCreate: (data: LoginRequest, params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          user?: Client;
          /** @example "Login successful" */
          message?: string;
        },
        any
      >({
        path: `/clients/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Устаревший метод выхода. Используйте /auth/logout
     *
     * @tags Clients
     * @name LogoutCreate
     * @summary Выход из системы (legacy)
     * @request POST:/clients/logout
     */
    logoutCreate: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example true */
          success?: boolean;
          /** @example "Logout successful" */
          message?: string;
        },
        any
      >({
        path: `/clients/logout`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
}
