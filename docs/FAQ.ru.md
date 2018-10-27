## Будет ли предусмотрена возможность выполнять SQL запросы к базе данных?

Да, будет. Хотя задача платформы максимально изолировать разработчика от работы с реляционной БД напрямую, тем не менее нельзя гарантировать, что во всех случаях мы сможем программно генерировать наиболее оптимальный код.

## В чем преимущество доступа к данным на уровне сущностей, по сравнению с SQL запросами?

ER модель платформы скрывает от пользователя (разработчика) аспекты физической реализации структур данных. Чтобы пояснить разницу с традиционным подходом возьмем достаточно простой пример: _выведем на печать компании из Могилевской области_.

В Гедымине разработчик должен вручную прописать SQL запрос в функции отчета. В нашем примере для создания такого запроса необходимо знать что:

1. Данные компании хранятся в трех таблицах, связанных между собой следующим образом: `GD_CONTACT JOIN GD_COMPANY LEFT JOIN GD_COMPANYCODE`
2. Таблица `GD_CONTACT` содержит поле `PLACEKEY`, которое является ссылкой (FK) на таблицу `GD_PLACE`
3. В таблице `GD_PLACE` есть поле `NAME`, по которому мы сможем найти объект __Могилевская область__.
4. Таблица `GD_PLACE` имеет древовидную структуру
5. Для того, чтобы извлечь объекты произвольного уровня вложенности понадобится умение работать с рекурсивным CTE или со структурой интервальных деревьев платформы Гедымин.

И хотя здесь нет никакой "космической" науки, практически нереально, чтобы такой запрос смог написать среднестатистический специалист IT отдела заказчика или тем более рядовой бухгалтер.

В GDMN мы либо формулируем запрос на естественном языке:

_"Покажи всех клиентов из Могилевской области"_,

либо создаем объект-запрос специальной структуры, который передаем системе для выполнения.

Для облегчения процесса, объект может быть создан с помощью графического построителя запросов.

И первое, и второе вполне по силам специалисту, разбирающемуся в своей предметной области, но не знакомому с тонкостями теории реляционных баз данных.

## Данные сущности всегда хранятся в одной или нескольких таблицах реляционной базы данных?

Нет. Данные сущности могут храниться где угодно: в реляционной базе данных, JSON файлах, CSV файлах и даже во внешних облачных источниках с доступом через REST или GraphQL.