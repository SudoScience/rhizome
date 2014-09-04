#!/bin/bash

## DEFINE VARIABLES ##
JAR_FILE="/Users/johndingee_seed/ODK_local/Briefcase_v1.4.4.jar"
FORM_ID="build_Polio-Sample_1406906455"
AGGREGATE_URL="http://10.0.1.71/"
STORAGE_DIRECTORY="/Users/johndingee_seed/ODK_local/"
EXPORT_DIRECTORY="/Users/johndingee_seed/ODK_local/csv_exports"
EXPORT_FILENAME="polio_sample.csv"
USERNAME="aggregate"
PASSWORD="aggregate"


## PULL FROM AGGREGATE AND EXPORT TO CSV ##
java -jar $JAR_FILE \
--form_id $FORM_ID \
--storage_directory $STORAGE_DIRECTORY \
 --aggregate_url $AGGREGATE_URL \
 --odk_username $USERNAME \
 --odk_password $PASSWORD \
 --export_directory $EXPORT_DIRECTORY \
 --export_filename $EXPORT_FILENAME;



## PARAMS FOR JAR FILE ##

# -ed,--export_directory </path/to/dir>
# -em,--exclude_media_export
# -end,--export_end_date <yyyy/MM/dd>
# -f,--export_filename <name.csv>
# -h,--help
# -id,--form_id <form_id>
# -oc,--overwrite_csv_export
# -od,--odk_directory </path/to/dir>
# -p,--odk_password <password>
# -pf,--pem_file </path/to/file.pem>
# -sd,--storage_directory </path/to/dir>
# -start,--export_start_date <yyyy/MM/dd>
# -u,--odk_username <username>
# -url,--aggregate_url <url>
# -v,--version