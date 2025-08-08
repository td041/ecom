-- DropIndex
DROP INDEX "User_email_key";

create unique index "User_email_unique"
on "User" (email)
where "deletedAt" is null 