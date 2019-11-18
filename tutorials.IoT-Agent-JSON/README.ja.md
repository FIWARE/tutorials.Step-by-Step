[![FIWARE Banner](https://fiware.github.io/tutorials.IoT-Agent/img/fiware.png)](https://www.fiware.org/developers)

[![FIWARE IoT Agents](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/iot-agents.svg)](https://github.com/FIWARE/catalogue/blob/master/iot-agents/README.md)
[![License: MIT](https://img.shields.io/github/license/fiware/tutorials.Iot-Agent.svg)](https://opensource.org/licenses/MIT)
[![Support badge](https://nexus.lab.fiware.org/repository/raw/public/badges/stackoverflow/fiware.svg)](https://stackoverflow.com/questions/tagged/fiware)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-blue.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)
[![UltraLight 2.0](https://img.shields.io/badge/Ultralight-2.0-5dc0cf.svg)](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
<br/> [![Documentation](https://img.shields.io/readthedocs/fiware-tutorials.svg)](https://fiware-tutorials.rtfd.io)

<!-- prettier-ignore -->
このチュートリアルでは、**IoT Agent** の概念を紹介し
、[以前のチュートリアル](https://github.com/FIWARE/tutorials.Context-Providers/)で
作成したダミーの
[UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
IoT デバイスを接続し
、[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) に送信
された [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) リクエスト
を使用して測定値を読み取り、コマンドを送信できるようにします。

このチュートリアルでは、全体で [cUrl](https://ec.haxx.se/) コマンドを使用していますが
、[Postman documentation](https://fiware.github.io/tutorials.IoT-Agent/) も利用できます。

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/2150531e68299d46f937)

## 内容

<details>
<summary>詳細 <b>(クリックして拡大)</b></summary>

-   [IoT Agent とは何ですか？](#what-is-an-iot-agent)
    -   [サウス・バウンドのトラフィック (コマンド)](#southbound-traffic-commands)
    -   [ノース・バウンドのトラフィック (測定)](#northbound-traffic-measurements)
    -   [共通の機能](#common-functionality)
-   [アーキテクチャ](#architecture)
    -   [ダミー IoT デバイスの設定](#dummy-iot-devices-configuration)
    -   [IoT Agent for UltraLight 2.0 の設定](#iot-agent-for-ultralight-20-configuration)
-   [前提条件](#prerequisites)
    -   [Docker と Docker Compose](#docker-and-docker-compose)
    -   [Cygwin for Windows](#cygwin-for-windows)
-   [起動](#start-up)
-   [IoT Agent のプロビジョニング](#provisioning-an-iot-agent)
    -   [IoT Agent サービスの正常性の確認](#checking-the-iot-agent-service-health)
    -   [IoT デバイスの接続](#connecting-iot-devices)
        -   [サービス・グループのプロビジョニング](#provisioning-a-service-group)
        -   [センサのプロビジョニング](#provisioning-a-sensor)
        -   [アクチュエータのプロビジョニング](#provisioning-an-actuator)
        -   [スマート・ドアのプロビジョニング](#provisioning-a-smart-door)
        -   [スマート・ランプのプロビジョニング](#provisioning-a-smart-lamp)
    -   [Context Broker コマンド の有効化](#enabling-context-broker-commands)
        -   [ベル・コマンドの登録](#registering-a-bell-command)
        -   [ベルを鳴らす](#ringing-the-bell)
        -   [スマート・ドア・コマンドの登録](#registering-smart-door-commands)
        -   [スマート・ドアを開く](#opening-the-smart-door)
        -   [スマート・ランプ・コマンドの登録](#registering-smart-lamp-commands)
        -   [スマート・ランプをオンにする](#switching-on-the-smart-lamp)
-   [サービス・グループの CRUD アクション](#service-group-crud-actions)
    -   [サービス・グループの作成](#creating-a-service-group)
    -   [サービス・グループの詳細を読み込む](#read-service-group-details)
    -   [すべてのサービス・グループを一覧表示](#list-all-service-groups)
    -   [サービス・グループを更新](#update-a-service-group)
    -   [サービス・グループを削除](#delete-a-service-group)
-   [デバイスの CRUD アクション](#device-crud-actions)
    -   [プロビジョニングされたデバイスの作成](#creating-a-provisioned-device)
    -   [プロビジョニングされたデバイスの詳細を読み込む](#read-provisioned-device-details)
    -   [プロビジョニングされたすべてのデバイスを一覧表示](#list-all-provisioned-devices)
    -   [プロビジョニングされたデバイスを更新](#update-a-provisioned-device)
    -   [プロビジョニングされたデバイスを削除](#delete-a-provisioned-device)
-   [次のステップ](#next-steps)

</details>

<a name="what-is-an-iot-agent"></a>

# IoT Agent とは何ですか？

> "In every operation there is an above the line and a below the line. Above the line is what you do by the book. Below
> the line is how you do the job."
>
> — John le Carré (A Perfect Spy)

IoT Agent は、デバイスのグループが独自のネイティブ・プロトコルを使用して Context Broker にデータを送信し、Context Broker
から管理できるようにするコンポーネントです。また、IoT Agent は、FIWARE プラットフォームのセキュリティ面(チャネルの認証と
認可)に対処し、他の共通サービスをデバイスのプログラマに提供できる必要があります。

Orion Context Broker は、すべての相互作用に対して排他的に [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2)
リクエストを使用します。各 IoT Agent は、 Context Broker の対話に使用される**ノース・ポート**
[NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) インターフェイスを提供し、このポートの下にあるすべての対
話は、接続されたデバイスの**ネイティブ・ プロトコル**を使用して行われます。

実際には、コンテキスト情報管理レベルでのすべての IoT インタラクションに対する標準インタフェースを提供します。IoT デバイ
スの各グループは、独自の専有プロトコルとさまざまなトランスポート・メカニズムを内部で使用できますが、関連する IoT Agent
はこの複雑さを処理する Facade パターンを提供します。

IoT Agent はすでに存在しているか、多くの IoT コミュニケーション・プロトコルとデータモデルのために開発中です。例には次の
ものがあります :

-   [IoTAgent-JSON](https://fiware-iotagent-json.readthedocs.io/en/latest/) - JSON ペイロードを持つ HTTP/MQTT メッセージ
    ング と NGSI のブリッジ
-   [IoTAgent-LWM2M](https://fiware-iotagent-lwm2m.readthedocs.io/en/latest) -
    [Lightweight M2M](https://www.omaspecworks.org/what-is-oma-specworks/iot/lightweight-m2m-lwm2m/) プロトコル と NGSI
    のブリッジ
-   [IoTAgent-UL](https://fiware-iotagent-ul.readthedocs.io/en/latest) - UltraLight2.0 ペイロード を持つ HTTP/MQTT メッ
    セージング と NGSI のブリッジ
-   [IoTagent-LoRaWAN](https://fiware-lorawan.readthedocs.io/en/latest) -
    [LoRaWAN](https://www.thethingsnetwork.org/docs/lorawan/) プロトコルと NGSI のブリッジ

<a name="southbound-traffic-commands"></a>

## サウス・バウンドのトラフィック (コマンド)

Context Broker から生成され、IoT Agent を介して、IoT デバイスに向けて下向きに渡された HTTP リクエストは、サウス・バウン
ド・トラフィックと呼ばれます。サウス・バウンドのトラフィックは、実際の動作の状態を動作によって変更するアクチュエータ・デ
バイスに対する**コマンド**で構成されています。

たとえば、実際の Ultra Light 2.0 **スマート・ランプ**をオンに切り替えるには、次のようなやりとりが発生します :

1.  **Context Broker** に NGSI PATCH リクエストが送信され、**スマート・ランプ**の現在のコンテキストが更新されます

-   これは事実上、**スマート・ランプ**の `on` コマンドを呼び出す間接的な要求です

2.  **Context Broker** は、コンテキスト内でエンティティを見つけ、この属性のコンテキスト・プロビジョニングは **IoT
    Agnet** に委任されていることに注意します
3.  **Context Broker** は、**IoT Agnet** のノース・ポートに NGSI リクエストを送信して、コマンドを呼び出します
4.  **IoT Agnet** は、このサウス・バウンドのリクエストを受信し、UltraLight 2.0 の構文に変換し、それを**スマート・ラン
    プ** に渡します
5.  **スマート・ランプ**はランプを点灯し、UltraLight 2.0 の構文で **IoT Agnet** にコマンドの結果を返します
6.  **IoT Agnet** はこのノース・バウンドのリクエストを受け取り、それを解釈し、**Context Broker** に NGSI リクエストを行
    うことによって、インタラクションの結果をコンテキストに渡します
7.  **Context Broker** は、このノース・バウンドのリクエストを受信して、コマンドの結果でコンテキストを更新します

![](https://fiware.github.io/tutorials.IoT-Agent/img/command-swimlane.png)

-   **ユーザ** と **Context Broker** との間のリクエストは NGSI を使用します
-   **Context Broker** と **IoT Agent** の間のリクエストは NGSI を使用します
-   **IoT Agent** と **IoT デバイス**間のリクエストは、ネイティブ・プロトコルを使用します
-   **IoT デバイス** と **IoT Agent** の間のリクエストは、ネイティブ・プロトコルを使用します
-   **IoT Agent** と **Context Broker** 間のリクエストは NGSI を使用します

<a name="northbound-traffic-measurements"></a>

## ノース・バウンドのトラフィック (測定)

IoT デバイスから生成され、IoT Agent を介して、Context Broker に向けて上向きに戻されたリクエストは、ノース・バウンドのト
ラフィックと呼ばれます。ノース・バウンドのトラフィックは、センサ・デバイスによって行われた**測定**からなり、現実世界の状
態をシステムのコンテキスト・データに中継します。

たとえば、実際の**モーション・センサ**がカウント測定値を送信するために、次のようなやり取りが行われます :

1.  **モーション・センサ**は測定を行い、その結果を **IoT Agent** に渡します
2.  **IoT Agent** は、このノース・バウンドのリクエストを受け取り、その結果を Ultra Light2.0 の構文から変換し、**Context
    Broker** に対して NGSI リクエストを行うことで、インタラクションの結果をコンテキストに渡します
3.  **Context Broker** は、このノース・バウンドのリクエストを受信し、測定結果でコンテキストを更新します

![](https://fiware.github.io/tutorials.IoT-Agent/img/measurement-swimlane.png)

-   **IoT デバイス** と **IoT Agent** 間のリクエストはネイティブ・プロトコルを使用します
-   **IoT Agent** と **Context Broker** 間のリクエストは NGSI を使用します

> **注** さらに複雑なやり取りも可能ですが、この概要は IoT Agent の基本原則を理解するのに十分です

<a name="common-functionality"></a>

## 共通の機能

前のセクションから分かるように、各 IoT Agent はさまざまなプロトコルを解釈するのでユニークになりますが、IoT Agent 間には
かなりの類似性があります。

-   デバイスのアップデートをリッスンする標準的な場所を提供
-   コンテキスト・データの更新をリッスンするための標準的な場所を提供
-   デバイスのリストを保持し、コンテキスト・データ属性をデバイス構文にマッピング
-   セキュリティ認証

この基本機能は、一般的な [IoT Agent framework library](https://iotagent-node-lib.readthedocs.io/) に抽象化されています。

#### デバイス・モニタ

このチュートリアルの目的のために、一連のダミーの IoT デバイスを作成し、Context Broker に接続します。使用するアーキテクチ
ャとプロトコルの詳細については、[IoT Sensors tutorial](https://github.com/FIWARE/tutorials.IoT-Sensors) を参照してくださ
い。各デバイスの状態は、次の UltraLight2.0 デバイスのモニタ Web ページで確認できます :
`http://localhost:3000/device/monitor`

![FIWARE Monitor](https://fiware.github.io/tutorials.IoT-Agent/img/device-monitor.png)

<a name="architecture"></a>

# アーキテクチャ

このアプリケーションは、[Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/) と
[IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) の 2 つの FIWARE コンポーネントを使
用します。アプリケーションが _“Powered by FIWARE”_ と認定されるには、Orion Context Broker を使用するだけで十分です
。Orion Context Broker と IoT Agent はオープンソースの MongoDB 技術を利用して、保持している情報の永続性を保ちます
。[以前のチュートリアル](https://github.com/FIWARE/tutorials.Context-Providers/)で作成したダミーの IoT デバイスも使用し
ます。

したがって、全体的なアーキテクチャは次の要素で構成されます :

-   [NGSI](https://fiware.github.io/specifications/ngsiv2/latest/) を使用してリクエストを受信する、FIWARE
    [Orion Context Broker](https://fiware-orion.readthedocs.io/en/latest/)
-   [NGSI](https://fiware.github.io/specifications/ngsiv2/latest/) を使用してサウス・バウンドのリクエストを受信し、デバ
    イスの
    [UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    コマンドに変換する、FIWARE [IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/)
-   基礎となる [MongoDB](https://www.mongodb.com/) データベース :
    -   **Orion Context Broker** が、データ・エンティティ、サブスクリプション、レジストレーションなどのコンテキスト・デ
        ータの情報を保持するために使用します
    -   **IoT Agent** が、デバイスの URL やキーなどのデバイス情報を保持するために使用します
-   コンテキスト・プロバイダの NGSI proxy は次のようになります :
    -   [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) を使用してリクエストを受信します
    -   独自の APIs を独自フォーマットで使用して、公開されているデータソースへのリクエストを行います
    -   [NGSI](https://fiware.github.io/specifications/OpenAPI/ngsiv2) 形式でコンテキスト・データを Orion Context Broker
        に返します
-   在庫管理フロントエンドは以下を行います :
    -   店舗情報を表示します
    -   各店舗で購入できる商品を表示します
    -   ユーザが製品を購入して在庫数を減らすことを許可します
-   HTTP 上で動作する
    [UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/usermanual/index.html#user-programmers-manual)
    プロトコルを使用して、ダミーの IoT デバイスのセットとして機能する Web サーバ

要素間のすべての対話は HTTP リクエストによって開始されるため、エンティティはコンテナ化され、公開されたポートから実行され
ます。

![](https://fiware.github.io/tutorials.IoT-Agent/img/architecture.png)

IoT デバイス と IoT Agent を接続するために必要な構成情報は、関連する `docker-compose.yml` ファイルの services セクション
にあります :

<a name="dummy-iot-devices-configuration"></a>

## ダミー IoT デバイスの設定

```yaml
tutorial:
    image: fiware/tutorials.context-provider
    hostname: iot-sensors
    container_name: fiware-tutorial
    networks:
        - default
    expose:
        - "3000"
        - "3001"
    ports:
        - "3000:3000"
        - "3001:3001"
    environment:
        - "DEBUG=tutorial:*"
        - "PORT=3000"
        - "IOTA_HTTP_HOST=iot-agent"
        - "IOTA_HTTP_PORT=7896"
        - "DUMMY_DEVICES_PORT=3001"
        - "DUMMY_DEVICES_API_KEY=4jggokgpepnvsb2uv4s40d59ov"
        - "DUMMY_DEVICES_TRANSPORT=HTTP"
```

`tutorial` コンテナは、2 つのポートでリッスンしています:

-   ポート`3000` が公開されているので、ダミー IoT デバイスを表示する Web ページが表示されます
-   ポート`3001` は純粋にチュートリアルのアクセスのために公開されているため、cUrl または Postman は同じネットワーク以外
    からも、UltraLight コマンドを作成できます

`tutorial` コンテナは、次のように環境変数によって設定値を指定できます :

| キー                    | 値                           | 説明                                                                                                                                            |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBUG                   | `tutorial:*`                 | ロギングに使用するデバッグ・フラグ                                                                                                              |
| WEB_APP_PORT            | `3000`                       | ダミー・デバイスのデータを表示する web-app が使用するポート                                                                                     |
| IOTA_HTTP_HOST          | `iot-agent`                  | Ultra Light 2.0 用 IoT Agent のホスト名 - 下記を参照                                                                                            |
| IOTA_HTTP_PORT          | `7896`                       | Ultra Light 2.0 の IoT Agent がリッスンするポート。`7896` は、Ultra Light over HTTP の一般的なデフォルトです                                    |
| DUMMY_DEVICES_PORT      | `3001`                       | コマンドを受信するためにダミー IoT デバイスが使用するポート                                                                                     |
| DUMMY_DEVICES_API_KEY   | `4jggokgpepnvsb2uv4s40d59ov` | UltraLight インタラクションに使用されるランダムなセキュリティキー - デバイスと IoT Agent 間のインタラクションの完全性を保証するために使用します |
| DUMMY_DEVICES_TRANSPORT | `HTTP`                       | ダミー IoT デバイスによって使用されるトランスポート・プロトコル                                                                                 |

このチュートリアルでは、YAML ファイルで説明されている他の `tutorial` コンテナの設定値は使用しません。

<a name="iot-agent-for-ultralight-20-configuration"></a>

## IoT Agent for UltraLight 2.0 の設定

[IoT Agent for UltraLight 2.0](https://fiware-iotagent-ul.readthedocs.io/en/latest/) は 、Docker コンテナ内でインスタン
ス化できます。公式の Docker イメージは、[Docker Hub](https://hub.docker.com/r/fiware/iotagent-ul/) で
、`fiware/iotagent-ul` とタグ付けされています。必要な構成を以下に示します:

```yaml
iot-agent:
    image: fiware/iotagent-ul:latest
    hostname: iot-agent
    container_name: fiware-iot-agent
    depends_on:
        - mongo-db
    networks:
        - default
    expose:
        - "4041"
        - "7896"
    ports:
        - "4041:4041"
        - "7896:7896"
    environment:
        - IOTA_CB_HOST=orion
        - IOTA_CB_PORT=1026
        - IOTA_NORTH_PORT=4041
        - IOTA_REGISTRY_TYPE=mongodb
        - IOTA_LOG_LEVEL=DEBUG
        - IOTA_TIMESTAMP=true
        - IOTA_CB_NGSI_VERSION=v2
        - IOTA_AUTOCAST=true
        - IOTA_MONGO_HOST=mongo-db
        - IOTA_MONGO_PORT=27017
        - IOTA_MONGO_DB=iotagentul
        - IOTA_HTTP_PORT=7896
        - IOTA_PROVIDER_URL=http://iot-agent:4041
```

`iot-agent` コンテナは、Orion Context Broker に依存し、MongoDB データベースを使用して、デバイスの URL やキーなどのデバイ
ス情報を保持します。コンテナが 2 つのポートをリッスンしています:

-   ポート `7896` は、ダミー IoT デバイスから HTTP 経由で Ultralight の測定値を受けるために公開されています
-   ポート `4041` は、チュートリアルのアクセスのためだけに公開されているため、cUrl または Postman は同じネットワーク以外
    からも、UltraLight コマンドを作成できます

`iot-agent` コンテナは、次のように環境変数によって設定値を指定できます :

| キー                 | 値                      | 説明                                                                                                                                   |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| IOTA_CB_HOST         | `orion`                 | コンテキストを更新する Context Broker のホスト名                                                                                       |
| IOTA_CB_PORT         | `1026`                  | Context Broker がコンテキストを更新するためにリッスンするポート                                                                        |
| IOTA_NORTH_PORT      | `4041`                  | IoT Agent の設定および Context Broker からのコンテキスト更新の受信に使用されるポート                                                   |
| IOTA_REGISTRY_TYPE   | `mongodb`               | メモリまたはデータベースに IoT デバイス情報を保持するかどうかを指定                                                                    |
| IOTA_LOG_LEVEL       | `DEBUG`                 | IoT Agent のログレベル                                                                                                                 |
| IOTA_TIMESTAMP       | `true`                  | 接続されたデバイスから受信した各測定値にタイムスタンプ情報を提供するかどうかを指定                                                     |
| IOTA_CB_NGSI_VERSION | `v2`                    | アクティブな属性の更新を送信するときに NGSI v2 を使用するように指定するかどうか                                                        |
| IOTA_AUTOCAST        | `true`                  | Ultralight の数値が文字列ではなく数値として読み取られるようにする                                                                      |
| IOTA_MONGO_HOST      | `context-db`            | mongoDB のホスト名 - デバイス情報を保持するために使用                                                                                  |
| IOTA_MONGO_PORT      | `27017`                 | mongoDB はリッスンしているポート                                                                                                       |
| IOTA_MONGO_DB        | `iotagentul`            | mongoDB で使用されるデータベースの名前                                                                                                 |
| IOTA_HTTP_PORT       | `7896`                  | IoT Agent が HTTP 経由で IoT デバイスのトラフィックをリッスンするポート                                                                |
| IOTA_PROVIDER_URL    | `http://iot-agent:4041` | コマンドが登録されたときに Context Broker に渡された URL。Context Broker がデバイスにコマンドを発行したときに転送 URL の場所として使用 |

<a name="prerequisites"></a>

# 前提条件

<a name="docker-and-docker-compose"></a>

## Docker

物事を単純にするために、両方のコンポーネントが [Docker](https://www.docker.com) を使用して実行されます。**Docker** は、
さまざまコンポーネントをそれぞれの環境に分離することを可能にするコンテナ・テクノロジです。

-   Docker Windows にインストールするには、[こちら](https://docs.docker.com/docker-for-windows/)の手順に従ってください
-   Docker Mac にインストールするには、[こちら](https://docs.docker.com/docker-for-mac/)の手順に従ってください
-   Docker Linux にインストールするには、[こちら](https://docs.docker.com/install/)の手順に従ってください

**Docker Compose** は、マルチコンテナ Docker アプリケーションを定義して実行するためのツールです
。[YAML file](https://raw.githubusercontent.com/Fiware/tutorials.IoT-Agent/master/docker-compose.yml) ファイルは、アプリ
ケーションのために必要なサービスを構成するために使用します。つまり、すべてのコンテナ・サービスは 1 つのコマンドで呼び出
すことができます。Docker Compose は、デフォルトで Docker for Windows と Docker for Mac の一部としてインストールされます
が、Linux ユーザは[ここ](https://docs.docker.com/compose/install/)に記載されている手順に従う必要があります。

次のコマンドを使用して、現在の **Docker** バージョンと **Docker Compose** バージョンを確認できます :

```console
docker-compose -v
docker version
```

Docker バージョン 18.03 以降と Docker Compose 1.21 以上を使用していることを確認し、必要に応じてアップグレードしてくださ
い。

<a name="cygwin-for-windows"></a>

## Cygwin for Windows

シンプルな bash スクリプトを使用してサービスを開始します。Windows ユーザは [cygwin](http://www.cygwin.com/) をダウンロー
ドして、Windows 上の Linux ディストリビューションと同様のコマンドライン機能を提供する必要があります。

<a name="start-up"></a>

# Start Up

開始する前に、必要な Docker イメージをローカルで取得または構築しておく必要があります。リポジトリを複製し、以下のコマンド
を実行して必要なイメージを作成してください :

```console
git clone https://github.com/FIWARE/tutorials.IoT-Agent.git
cd tutorials.IoT-Agent

./services create
```

その後、リポジトリ内で提供される、[services](https://github.com/FIWARE/tutorials.IoT-Agent/blob/master/services) Bash ス
クリプトを実行することによって、コマンドラインからすべてのサービスを初期化することができます :

```console
./services start
```

> :information_source: **注:** クリーンアップしてやり直す場合は、次のコマンドを実行してください :
>
> ```console
> ./services stop
> ```

<a name="provisioning-an-iot-agent"></a>

# IoT Agent のプロビジョニング

チュートリアルを正しく実行するには、ブラウザのデバイス・モニタ・ページが表示されていることを確認し、ページをクリックして
cUrl コマンドを入力する前にオーディオを有効にしてください。デバイス・モニタには、Ultralight 2.0 構文を使用してダミー・
デバイスのアレイの現在の状態が表示されます。

#### デバイス・モニタ

デバイス・モニタは次の場所にあります: `http://localhost:3000/device/monitor`

<a name="checking-the-iot-agent-service-health"></a>

## IoT Agent サービスの正常性の確認

IoT Agent が動作しているかどうかは、公開されているポートに対して HTTP リクエストを行うことで確認できます:

#### :one: リクエスト :

```console
curl -X GET \
  'http://localhost:4041/iot/about'
```

レスポンスは次のようになります:

```json
{
    "libVersion": "2.6.0-next",
    "port": "4041",
    "baseRoot": "/",
    "version": "1.6.0-next"
}
```

> **`Failed to connect to localhost port 4041: Connection refused` のレスポンスを受け取ったらどうしますか？**
>
> `Connection refused` のレスポンスを受け取った場合、IoT Agent がこのチュートリアルで期待される場所に見つからないためで
> す。各 cUrl コマンドの URL とポートを訂正された IP アドレスで置き換える必要があります。すべての cUrl コマンドのチュー
> トリアルでは、IoT Agent が `localhost:4041` で使用可能であると想定しています。
>
> 以下の対策を試してください:
>
> -   Docker コンテナが動作していることを確認するには、次のようにしてください:
>
> ```console
> docker ps
> ```
>
> 実行中の 4 つのコンテナが表示されます。IoT Agent が実行されていない場合は、必要に応じてコンテナを再起動できます。この
> コマンドは、開いているポート情報も表示します。
>
> -   [`docker-machine`](https://docs.docker.com/machine/) と [Virtual Box](https://www.virtualbox.org/) をインストール
>     した場合、Context Broker, IoT Agent, IoT Agnet とダミー・デバイスの Docker コンテナが別の IP アドレスから実行され
>     ている可能性があります:
>
> ```console
> curl -X GET \
>  'http://$(docker-machine ip default):4041/version'
> ```
>
> または、コンテナ・ネットワーク内からすべての curl コマンドを実行します:
>
> ```console
> docker run --network fiware_default --rm appropriate/curl -s \
>  -X GET 'http://iot-agent:4041/iot/about'
> ```

<a name="connecting-iot-devices"></a>

## IoT デバイスの接続

IoT Agent は、IoT デバイスと Context Broker との間のミドルウェアとして機能します。したがって、ユニークな IDs を持つコン
テキスト・データのエンティティを作成できる必要があります。サービスがプロビジョニングされ、未知のデバイスが測定を行うと
、IoT Agent は、デバイスが認識され、既知の ID にマッピングされない限り、提供された `<device-id>` を使用して、これをコン
テキストに追加します。

提供されたすべての IoT デバイス `<device-id>` が常に一意であるという保証はないため、IoT Agent へのすべてのプロビジョニン
グ・リクエストには、2 つの必須ヘッダが必要です:

-   `fiware-service` ヘッダは、特定のサービスのエンティティを別の mongoDB データベースに保持できるように定義します
-   `fiware-servicepath` デバイスの配列間を区別するために使用できます

たとえば、スマートシティ・アプリケーションでは、さまざまな部門(パーク、交通機関、ごみ収集など)ごとに異なる
`fiware-service` ヘッダが必要であり、各 `fiware-servicepath` が特定の公園などを参照します。これは、各サービスのデータと
デバイスが必要に応じて識別され、分離されることを意味しますが、データはサイロ化されません。たとえば、公園内の**スマート・
ビン**のデータは、ごみ収集車 の **GPS ユニット** と組み合わせて 、効率的な方法でトラックのルートを変更することができます
。

**スマート・ビン**と **GPS ユニット**は、さまざまなメーカーのものを使用する可能性があり、使用される `<device-id>` に重複
がないことを保証することはできません。`fiware-service` ヘッダと `fiware-servicepath` ヘッダの使用は、これが常に当てはま
ることを保証し、Context Broker がコンテキスト・データの元のソースを識別することを可能にします。

<a name="provisioning-a-service-group"></a>

### サービス・グループのプロビジョニング

各測定で認証キーを供給することが常に必要であり、IoT Agent は Context Broker がどの URL をレスポンスしているかを最初に知
ることができないため、グループ接続の呼び出しは常にデバイス接続の第一歩です。

また、すべての匿名デバイスのデフォルトのコマンドと属性を設定することもできますが、このチュートリアルでは各デバイスを個別
にプロビジョニングするため、これは行いません。

この例では、匿名のデバイス・グループをプロビジョニングします。これは、IoT Agent に、一連のデバイスが、IoT Agent が**ノー
ス・バウンド**通信をリッスンしている `IOTA_HTTP_PORT` クライアントにメッセージを送信することを通知します。

#### :two: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/services' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
 "services": [
   {
     "apikey":      "4jggokgpepnvsb2uv4s40d59ov",
     "cbroker":     "http://orion:1026",
     "entity_type": "Thing",
     "resource":    "/iot/d"
   }
 ]
}'
```

この例では、`/iot/d` エンドポイントが使用され、デバイスがトークン `4jggokgpepnvsb2uv4s40d59ov` を含めることによって自身
を認証することが IoT Agent に通知されます。UltraLight IoT Agent の場合、これはデバイスが GET リクエストまたは POST リク
エストを次の宛先に送信していることを意味します:

```
http://iot-agent:7896/iot/d?i=<device_id>&k=4jggokgpepnvsb2uv4s40d59ov
```

これは、[以前のチュートリアル](https://github.com/FIWARE/tutorials.IoT-Sensors)で Ultra Light 2.0 の構文に慣れているはず
です。

IoT デバイスからの測定値がリソース url で受信されると、それを解釈して Context Broker に渡す必要があります。こ
の`entity_type` 属性は、リクエストを行った各装置のデフォルト `type` を提供します。この場合、匿名の装置は `Thing` エンテ
ィティと呼ばれます。さらに、IoT Agent が受信した任意の測定値を正しい場所に渡すことができるように、Context Broker
(`cbroker`) の位置が必要です。`cbroker` はオプションの属性です。IoT Agent が提供されていない場合、IoT Agent は設定ファイ
ルで定義されている、Context Broker URL を使用しますが、完全性のためにここに含まれています。

<a name="provisioning-a-sensor"></a>

### センサのプロビジョニング

エンティティを作成するときは、NGSI-LD
[仕様](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.01.01_60/gs_CIM009v010101p.pdf)に従って URNs を使用するの
が一般的な良い方法です。さらに、データ属性を定義するときに意味のある名前にするとわかりやすくなります。これらのマッピング
は、デバイスを個別にプロビジョニングすることによって定義できます。

3 つのタイプの測定値の属性をプロビジョニングできます:

-   `attributes` デバイスからのアクティブな読み取り値
-   `lazy` リクエストに応じて送信されます - IoT Agent は測定結果を返すようにデバイスに通知
-   `static_attributes` Context Broker に渡される、リレーションシップなどのデバイスに関する静的なデータを示す名前

> **注**: 個体 id が必要でないか、または集約されたデータが十分である場合は、個別にではなくプロビジョニング・サービス内で
> `attributes` を定義できます

#### :three: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/devices' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
 "devices": [
   {
     "device_id":   "motion001",
     "entity_name": "urn:ngsi-ld:Motion:001",
     "entity_type": "Motion",
     "timezone":    "Europe/Berlin",
     "attributes": [
       { "object_id": "c", "name": "count", "type": "Integer" }
     ],
     "static_attributes": [
       { "name":"refStore", "type": "Relationship", "value": "urn:ngsi-ld:Store:001"}
     ]
   }
 ]
}
'
```

リクエストでは、デバイス `motion001` を URN `urn:ngsi-ld:Motion:001` と関連付けて、デバイスの読み取り値 `c` を `Integer`
として定義されているコンテキスト属性 `count` とマッピングしています。`refStore` は static_attribute として定義され、デバ
イスを **Store** `urn:ngsi-ld:Store:001` 内に配置します。

**モーション・センサ**のデバイス `motion001` からのダミー IoT デバイスの測定値をシミュレーションするには、次のリクエスト
を行います

#### :four: リクエスト :

```console
curl -iX POST \
  'http://localhost:7896/iot/d?k=4jggokgpepnvsb2uv4s40d59ov&i=motion001' \
  -H 'Content-Type: text/plain' \
  -d 'c|1'
```

IoT Agent が接続される前、以前のチュートリアルで同様のリクエストが行われ、ドアがロック解除されると、各**モーション・セン
サ**の状態が変化し、デバイス・モニタにノース・バウンドのリクエストが記録されます。

今度は、IoT Agent が接続され、サービス・グループは IoT Agent が (`iot/d`) をリッスンしているリソースと、リクエスト
(4jggokgpepnvsb2uv4s40d59ov)を認証するために使用された API キーを定義しました。これらの両方が認識されるので測定は有効で
す。

IoT Agent はデバイス(`motion001`)を特別にプロビジョニングしたため、Orion Context Broker でリクエストを発行する前に属性を
マップできます。

Context Broker からエンティティのデータを取得することによって、測定値が記録されていることがわかります。`fiware-service`
と `fiware-service-path` ヘッダを追加することを忘れないでください。

#### :five: リクエスト :

```console
curl -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Motion:001?type=Motion' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### レスポンス :

```json
{
    "id": "urn:ngsi-ld:Motion:001",
    "type": "Motion",
    "TimeInstant": {
        "type": "ISO8601",
        "value": "2018-05-25T10:51:32.00Z",
        "metadata": {}
    },
    "count": {
        "type": "Integer",
        "value": "1",
        "metadata": {
            "TimeInstant": {
                "type": "ISO8601",
                "value": "2018-05-25T10:51:32.646Z"
            }
        }
    },
    "refStore": {
        "type": "Relationship",
        "value": "urn:ngsi-ld:Store:001",
        "metadata": {
            "TimeInstant": {
                "type": "ISO8601",
                "value": "2018-05-25T10:51:32.646Z"
            }
        }
    }
}
```

レスポンスは、`id = motion001`の**モーション・センサ**のデバイスが IoT Agnet によって正常に識別され、エンティティ
`id=urn:ngsi-ld:Motion:001` にマッピングされていることを示します。この新しいエンティティは、コンテキスト・データ内で作成
されました。ダミー・デバイスの測定リクエストからの `c` 属性はコンテキスト内のより意味のある `count` 属性にマップされてい
ます。お気づきのように、`TimeInstant` 属性がエンティティと属性のメタデータの両方に追加されました。これはエンティティと属
性が最後に更新された時刻を表し、`IOTA_TIMESTAMP` 環境変数が IoT Agent の起動時に設定されます。`refStore` 属性は、デバイ
スがプロビジョニングされたときにセットされた `static_attributes` から来ます。

<a name="provisioning-an-actuator"></a>

### アクチュエータのプロビジョニング

アクチュエータのプロビジョニングは、センサのプロビジョニングと同様です。今回、`endpoint` 属性には、IoT Agent が
UltraLight コマンドを送信する必要がある場所が格納され、`commands` 配列には呼び出すことができる各コマンドのリストが含まれ
ています。以下の例では、`deviceId=bell001` のベルがプロビジョニングされています。エンドポイントは
`http://iot-sensors:3001/iot/bell001` であり、`ring` コマンドを受け入れることができます。

#### :six: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/devices' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "devices": [
    {
      "device_id": "bell001",
      "entity_name": "urn:ngsi-ld:Bell:001",
      "entity_type": "Bell",
      "protocol": "PDI-IoTA-UltraLight",
      "transport": "HTTP",
      "endpoint": "http://iot-sensors:3001/iot/bell001",
      "commands": [
        { "name": "ring", "type": "command" }
       ],
       "static_attributes": [
         {"name":"refStore", "type": "Relationship","value": "urn:ngsi-ld:Store:001"}
      ]
    }
  ]
}
'
```

Context Broker を接続する前に、`/v1/updateContext` エンドポイントを使用して IoT Agent のノース・ポートに REST リクエスト
を直接送信することで、コマンドをデバイスに送信できることをテストできます。Context Broker が接続すると、最終的に Context
Broker によって呼び出されるのはこのエンドポイントです。設定をテストするには、次のようにコマンドを直接実行します :

#### :seven: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/v1/updateContext' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
    "contextElements": [
        {
            "type": "Bell",
            "isPattern": "false",
            "id": "urn:ngsi-ld:Bell:001",
            "attributes": [
                { "name": "ring", "type": "command", "value": "" }
            ],
            "static_attributes": [
               {"name":"refStore", "type": "Relationship","value": "urn:ngsi-ld:Store:001"}
            ]
        }
    ],
    "updateAction": "UPDATE"
}'
```

#### レスポンス :

```json
{
    "contextResponses": [
        {
            "contextElement": {
                "attributes": [
                    {
                        "name": "ring",
                        "type": "command",
                        "value": ""
                    }
                ],
                "id": "urn:ngsi-ld:Bell:001",
                "isPattern": false,
                "type": "Bell"
            },
            "statusCode": {
                "code": 200,
                "reasonPhrase": "OK"
            }
        }
    ]
}
```

デバイス・モニタ・ページを表示している場合は、ベル変更の状態も表示できます。

![](https://fiware.github.io/tutorials.IoT-Agent/img/bell-ring.gif)

ベルを鳴らすコマンドの結果は、Orion Context Broker 内のエンティティにクエリすることによって読み取ることができます。

#### :eight: リクエスト :

```console
curl -X GET \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Bell:001?type=Bell&options=keyValues' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### レスポンス :

```json
{
    "id": "urn:ngsi-ld:Bell:001",
    "type": "Bell",
    "TimeInstant": "2018-05-25T20:06:28.00Z",
    "refStore": "urn:ngsi-ld:Store:001",
    "ring_info": " ring OK",
    "ring_status": "OK",
    "ring": ""
}
```

`TimeInstant` は、エンティティに関連付けられたコマンドが呼び出された時刻を最後に表示します。 リング・コマンドの結果は
、`ring_info` 属性の値で見ることができます。

<a name="provisioning-a-smart-door"></a>

### スマート・ドアのプロビジョニング

コマンドと測定の両方を提供するデバイスのプロビジョニングは、リクエストの本文に `attributes` と `command` 属性の両方を含
む、HTTP POST リクエストを作成するだけです。

#### :nine: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/devices' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "devices": [
    {
      "device_id": "door001",
      "entity_name": "urn:ngsi-ld:Door:001",
      "entity_type": "Door",
      "protocol": "PDI-IoTA-UltraLight",
      "transport": "HTTP",
      "endpoint": "http://iot-sensors:3001/iot/door001",
      "commands": [
        {"name": "unlock","type": "command"},
        {"name": "open","type": "command"},
        {"name": "close","type": "command"},
        {"name": "lock","type": "command"}
       ],
       "attributes": [
        {"object_id": "s", "name": "state", "type":"Text"}
       ],
       "static_attributes": [
         {"name":"refStore", "type": "Relationship","value": "urn:ngsi-ld:Store:001"}
       ]
    }
  ]
}
'
```

<a name="provisioning-a-smart-lamp"></a>

### スマート・ランプのプロビジョニング

同様に、2 つのコマンド(`on` および `off`)と 2 つの属性を持つ**スマート・ランプ**は、次のようにプロビジョニングできます:

#### :one::zero:リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/devices' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "devices": [
    {
      "device_id": "lamp001",
      "entity_name": "urn:ngsi-ld:Lamp:001",
      "entity_type": "Lamp",
      "protocol": "PDI-IoTA-UltraLight",
      "transport": "HTTP",
      "endpoint": "http://iot-sensors:3001/iot/lamp001",
      "commands": [
        {"name": "on","type": "command"},
        {"name": "off","type": "command"}
       ],
       "attributes": [
        {"object_id": "s", "name": "state", "type":"Text"},
        {"object_id": "l", "name": "luminosity", "type":"Integer"}
       ],
       "static_attributes": [
         {"name":"refStore", "type": "Relationship","value": "urn:ngsi-ld:Store:001"}
      ]
    }
  ]
}
'
```

プロビジョニングされたデバイスの完全なリストは、`/iot/devices` エンドポイントに GET リクエストを行うことで取得できます。

#### :one::one: リクエスト :

```console
curl -X GET \
  'http://localhost:4041/iot/devices' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

<a name="enabling-context-broker-commands"></a>

## Context Broker コマンド の有効化

IoT Agent を IoT デバイスに接続したら、コマンドが利用可能であることを Orion Context Broker に通知する必要があります。つ
まり、IoT Agent をコマンド属性の[コンテキストプロバイダ](https://github.com/FIWARE/tutorials.Context-Providers/)として登
録する必要があります。

コマンドが登録されていたら、[以前のチュートリアル](https://github.com/FIWARE/tutorials.IoT-Sensors)で行ったように、IoT
デバイスから直接 Ultra Light 2.0 リクエストを送信するのではなく、**ベル**に呼び出し音を出したり、**スマート・ドア**を開
閉したり、**スイッチスマート・ランプ**をオン/オフに切り替えることができます。

<a name="registering-a-bell-command"></a>

### ベル・コマンドの登録

**ベル**のエンティティは、エンティティタイプ `type="Bell"` の `id="urn:ngsi-ld:Bell:001"` にマッピングされています。コマ
ンドを登録するには、`http://orion:1026/v1` が欠落している `ring` 属性を提供できることを Orion に通知する必要があります。
これは IoT Agent に転送されます。ご覧のとおり、これは NGSI v1 エンドポイントであるため、`legacyForwarding` 属性も設定す
る必要があります。

#### :one::two: リクエスト :

```console
curl -iX POST \
  'http://localhost:1026/v2/registrations' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Bell Commands",
  "dataProvided": {
    "entities": [
      {
        "id": "urn:ngsi-ld:Bell:001", "type": "Bell"
      }
    ],
    "attrs": ["ring"]
  },
  "provider": {
    "http": {"url": "http://orion:1026/v1"},
    "legacyForwarding": true
  }
}'
```

<a name="ringing-the-bell"></a>

### ベルを鳴らす

`ring` コマンドを呼び出すには、コンテキスト内で `ring` 属性を更新する必要があります。

#### :one::three: リクエスト :

```console
curl -iX PATCH \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Bell:001/attrs' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "ring": {
      "type" : "command",
      "value" : ""
  }
}'
```

デバイス・モニタ・ページを表示している場合は、ベル変更の状態も表示できます。

![](https://fiware.github.io/tutorials.IoT-Agent/img/bell-ring.gif)

<a name="registering-smart-door-commands"></a>

### スマート・ドア・コマンドの登録

**スマート・ドア**のエンティティは、エンティティ・タイプ `type="Door"` で、`id="urn:ngsi-ld:Door:001"` にマップされてい
ます。コマンドを登録するには、URL `http://orion:1026/v1` が不足している属性を提供できることを Orion に通知する必要があり
ます。 これは IoT Agent に転送されます。 ご覧のとおり、これは NGSI v1 エンドポイントであるため、`legacyForwarding` 属性
も設定する必要があります。

#### :one::four: リクエスト :

```console
curl -iX POST \
  'http://localhost:1026/v2/registrations' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Door Commands",
  "dataProvided": {
    "entities": [
      {
        "id": "urn:ngsi-ld:Door:001", "type": "Door"
      }
    ],
    "attrs": [ "lock", "unlock", "open", "close"]
  },
  "provider": {
    "http": {"url": "http://orion:1026/v1"},
    "legacyForwarding": true
  }
}'
```

<a name="opening-the-smart-door"></a>

### スマート・ドアを開く

`open` コマンドを呼び出すには、コンテキスト内で `open` 属性を更新する必要があります。

#### :one::five: リクエスト :

```console
curl -iX PATCH \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Door:001/attrs' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "open": {
      "type" : "command",
      "value" : ""
  }
}'
```

<a name="registering-smart-lamp-commands"></a>

### スマート・ランプ・コマンドの登録

**スマート・ランプ**のエンティティは、エンティティ `type="Lamp"` の `id="urn:ngsi-ld:Lamp:001"` にマップされています。コ
マンドを登録するには、URL `http://orion:1026/v1` が不足している属性を提供できることを Orion に通知する必要があります。こ
れは IoT Agent に転送されます。ご覧のとおり、これは NGSI v1 エンドポイントなので、`legacyForwarding` 属性も設定する必要
があります。

#### :one::six: リクエスト :

```console
curl -iX POST \
  'http://localhost:1026/v2/registrations' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "description": "Lamp Commands",
  "dataProvided": {
    "entities": [
      {
        "id": "urn:ngsi-ld:Lamp:001","type": "Lamp"
      }
    ],
    "attrs": [ "on", "off" ]
  },
  "provider": {
    "http": {"url": "http://orion:1026/v1"},
    "legacyForwarding": true
  }
}'
```

<a name="switching-on-the-smart-lamp"></a>

### スマート・ランプをオンにする

**スマート・ランプ**をオンにするには、その `on` 属性をコンテキストで更新する必要があります。

#### :one::seven: リクエスト :

```console
curl -iX PATCH \
  'http://localhost:1026/v2/entities/urn:ngsi-ld:Lamp:001/attrs' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "on": {
      "type" : "command",
      "value" : ""
  }
}'
```

<a name="service-group-crud-actions"></a>

# サービス・グループの CRUD アクション

サービス・グループをプロビジョニングするための **CRUD** 操作は、`/iot/services` エンドポイントの下にある期待される HTTP
動詞にマップされます。

-   **Create** - HTTP POST
-   **Read** - HTTP GET
-   **Update** - HTTP PUT
-   **Delete** - HTTP DELETE

`resource` と `apikey` パラメータを使用して、サービス・グループを一意に識別します。

<a name="creating-a-service-group"></a>

### サービス・グループの作成

この例では、匿名のデバイス・グループをプロビジョニングします。IoT Agent は、一連のデバイスが、 IoT Agent が**ノース・バ
ウンド**通信をリッスンしている `IOTA_HTTP_PORT` にメッセージを送信することを通知します。

#### :one::eight: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/services' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
 "services": [
   {
     "apikey":      "4jggokgpepnvsb2uv4s40d59ov",
     "cbroker":     "http://orion:1026",
     "entity_type": "Thing",
     "resource":    "/iot/d"
   }
 ]
}'
```

<a name="read-service-group-details"></a>

### サービス・グループの詳細を読み込む

この例では、指定された `resource` パスを持つプロビジョニングされたサービスの完全な詳細を取得します。

サービス・グループの詳細は、`/iot/services` エンドポイントへの GET リクエストと `resource` パラメータの提供によって読み
取ることができます。

#### :one::nine: リクエスト :

```console
curl -X GET \
  'http://localhost:4041/iot/services?resource=/iot/d' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### レスポンス :

```json
{
    "_id": "5b07b2c3d7eec57836ecfed4",
    "subservice": "/",
    "service": "openiot",
    "apikey": "4jggokgpepnvsb2uv4s40d59ov",
    "resource": "/iot/d",
    "attributes": [],
    "lazy": [],
    "commands": [],
    "entity_type": "Thing",
    "internal_attributes": [],
    "static_attributes": []
}
```

レスポンスには、`entity_type` などの各サービス・グループに関連付けられているすべてのデフォルトや、デフォルトのコマンド、
または属性のマッピングなどが含まれます。

<a name="list-all-service-groups"></a>

### すべてのサービス・グループを一覧表示

この例では、`/iot/services` エンドポイントに GET リクエストを行うことによって、プロビジョニングされたすべてのサービスを
一覧表示します。

#### :two::zero: リクエスト :

```console
curl -X GET \
  'http://localhost:4041/iot/services' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### レスポンス :

```json
{
    "_id": "5b07b2c3d7eec57836ecfed4",
    "subservice": "/",
    "service": "openiot",
    "apikey": "4jggokgpepnvsb2uv4s40d59ov",
    "resource": "/iot/d",
    "attributes": [],
    "lazy": [],
    "commands": [],
    "entity_type": "Thing",
    "internal_attributes": [],
    "static_attributes": []
}
```

レスポンスには、`entity_type` などの各サービス・グループに関連付けられているすべてのデフォルトや、デフォルトのコマンド、
または属性のマッピングなどが含まれます。

<a name="update-a-service-group"></a>

### サービス・グループを更新

この例では、既存のサービス・グループを特定の `resource` パスおよび `apikey` で更新します。

サービス・グループの詳細は、`/iot/services` エンドポイントへの PUT リクエストを行い、`resource` および `apikey` パラメー
タを提供することによって更新できます。

#### :two::one: リクエスト :

```console
curl -iX PUT \
  'http://localhost:4041/iot/services?resource=/iot/d&apikey=4jggokgpepnvsb2uv4s40d59ov' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "entity_type": "IoT-Device"
}'
```

<a name="delete-a-service-group"></a>

### サービス・グループを削除

この例では、`/iot/services/` エンドポイントに DELETE リクエストを行うことによって、プロビジョニングされたサービス・グル
ープを削除します。

つまり、IoT Agent が**ノース・バウンド**通信をリスンしている
`http://iot-agent:7896/iot/d?i=<device_id>&k=4jggokgpepnvsb2uv4s40d59ov` へのリクエストは、IoT Agent によって処理されな
くなります。削除するサービス・グループを識別するには、`apiKey` パラメータと `resource` パラメータを指定する必要がありま
す。

#### :two::two: リクエスト :

```console
curl -iX DELETE \
  'http://localhost:4041/iot/services/?resource=/iot/d&apikey=4jggokgpepnvsb2uv4s40d59ov' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

# デバイスの CRUD アクション

個々のデバイスをプロビジョニングするための **CRUD** 操作は、`/iot/devices` エンドポイントの下にある期待される HTTP 動詞
にマッピングされます

-   **Create** - HTTP POST
-   **Read** - HTTP GET
-   **Update** - HTTP PUT
-   **Delete** - HTTP DELETE

`<device-id>` を使用して、デバイスを一意に識別します。

<a name="creating-a-provisioned-device"></a>

### プロビジョニングされたデバイスの作成

この例では個々のデバイスをプロビジョニングします。`device_id=bell002` をエンティティ `urn:ngsi-ld:Bell:002` にマップし、
エンティティに `Bell` 型を与えます。IoT Agent は、デバイスが単一の `ring` `command` を提供し、HTTP を使用して
`http://iot-sensors:3001/iot/bell002` でリッスンしていることを通知されました。`attributes`, `lazy` 属性と
、`static_attributes` もプロビジョニングできます。

#### :two::three: リクエスト :

```console
curl -iX POST \
  'http://localhost:4041/iot/devices' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "devices": [
    {
      "device_id": "bell002",
      "entity_name": "urn:ngsi-ld:Bell:002",
      "entity_type": "Bell",
      "protocol": "PDI-IoTA-UltraLight",
      "transport": "HTTP",
      "endpoint": "http://iot-sensors:3001/iot/bell002",
      "commands": [
        {
          "name": "ring",
          "type": "command"
        }
       ],
       "static_attributes": [
         {"name":"refStore", "type": "Relationship","value": "urn:ngsi-ld:Store:002"}
      ]
    }
  ]
}'
```

<a name="read-provisioned-device-details"></a>

### プロビジョニングされたデバイスの詳細を読み込む

この例では、指定された `<device-id>` パスを持つプロビジョニングされたデバイスの完全な詳細を取得します。

プロビジョニングされたデバイスの詳細は、`/iot/devices/<device-id>` エンドポイントに GET リクエストを行うことで読み取るこ
とができます。

#### :two::four: リクエスト :

```console
curl -X GET \
  'http://localhost:4041/iot/devices/bell002' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### レスポンス :

レスポンスには、デバイスに関連付けられているすべてのコマンドと属性のマッピングが含まれています。

```json
{
    "device_id": "bell002",
    "service": "openiot",
    "service_path": "/",
    "entity_name": "urn:ngsi",
    "entity_type": "Bell",
    "endpoint": "http://iot-sensors:3001/iot/bell002",
    "transport": "HTTP",
    "attributes": [],
    "lazy": [],
    "commands": [
        {
            "object_id": "ring",
            "name": "ring",
            "type": "command"
        }
    ],
    "static_attributes": [
        {
            "name": "refStore",
            "type": "Relationship",
            "value": "urn:ngsi-ld:Store:002"
        }
    ],
    "protocol": "PDI-IoTA-UltraLight"
}
```

<a name="list-all-provisioned-devices"></a>

### プロビジョニングされたすべてのデバイスを一覧表示

この例では、`/iot/devices` エンドポイントに GET リクエストを行うことによって、プロビジョニングされたすべてのデバイスを一
覧表示します。

#### :two::five: リクエスト :

```console
curl -X GET \
  'http://localhost:4041/iot/devices' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

#### レスポンス :

レスポンスには、すべてのデバイスに関連付けられているすべてのコマンドと属性のマッピングが含まれます。

```json
{
    "count": 5,
    "devices": [
      {
          "device_id": "bell002",
          "service": "openiot",
          "service_path": "/",
          "entity_name": "urn:ngsi",
          "entity_type": "Bell",
          "endpoint": "http://iot-sensors:3001/iot/bell002",
          "transport": "HTTP",
          "attributes": [],
          "lazy": [],
          "commands": [
              {
                  "object_id": "ring",
                  "name": "ring",
                  "type": "command"
              }
          ],
          "static_attributes": [
              {
                  "name": "refStore",
                  "type": "Relationship",
                  "value": "urn:ngsi-ld:Store:002"
              }
          ],
          "protocol": "PDI-IoTA-UltraLight"
      },
      etc...
    ]
}
```

<a name="update-a-provisioned-device"></a>

### プロビジョニングされたデバイスを更新

この例では、`/iot/devices/<device-id>` エンドポイントに PUT リクエストを行うことによって、既存のプロビジョニングされたデ
バイスを更新します。

#### :two::six: リクエスト :

```console
curl -iX PUT \
  'http://localhost:4041/iot/devices/bell002' \
  -H 'Content-Type: application/json' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /' \
  -d '{
  "entity_type": "IoT-Device"
}'
```

<a name="delete-a-provisioned-device"></a>

### プロビジョニングされたデバイスを削除

この例では、`/iot/devices/<device-id>` エンドポイントに DELETE リクエストを行うことによって、プロビジョニングされたデバ
イスを削除します。

デバイスの属性はマップされなくなり、コマンドはデバイスに送信できなくなります。デバイスがアクティブな測定を行っていると、
関連付けられたサービスが削除されていない場合でも、デフォルト値で処理されます。

#### :two::seven: リクエスト :

```console
curl -iX DELETE \
  'http://localhost:4041/iot/devices/bell002' \
  -H 'fiware-service: openiot' \
  -H 'fiware-servicepath: /'
```

<a name="next-steps"></a>

# 次のステップ

高度な機能を追加することで、アプリケーションに複雑さを加える方法を知りたいですか？このシリーズ
の[他のチュートリアル](https://www.letsfiware.jp/fiware-tutorials)を読むことで見つけることができます :

---

## License

[MIT](LICENSE) © 2018-2019 FIWARE Foundation e.V.
