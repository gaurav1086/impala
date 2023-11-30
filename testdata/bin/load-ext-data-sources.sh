#!/bin/bash
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
# This script create and load the jdbc data source target table in Postgres.

set -euo pipefail
. $IMPALA_HOME/bin/report_build_error.sh
setup_report_build_error

. ${IMPALA_HOME}/bin/impala-config.sh > /dev/null 2>&1

# Create functional.alltype table
dropdb -U hiveuser functional || true
createdb -U hiveuser functional

# Create jdbc table
cat > /tmp/jdbc_alltypes.sql <<__EOT__
DROP TABLE IF EXISTS alltypes;
CREATE TABLE alltypes
(
    id              INT,
    bool_col        BOOLEAN,
    tinyint_col     SMALLINT,
    smallint_col    SMALLINT,
    int_col         INT,
    bigint_col      BIGINT,
    float_col       FLOAT,
    double_col      DOUBLE PRECISION,
    date_string_col VARCHAR(8),
    string_col      VARCHAR(10),
    timestamp_col   TIMESTAMP
);
__EOT__
sudo -u postgres psql -U hiveuser -d functional -f /tmp/jdbc_alltypes.sql

# Create jdbc table with case sensitive names for table and columns.
cat > /tmp/jdbc_alltypes_with_quote.sql <<__EOT__
DROP TABLE IF EXISTS "AllTypesWithQuote";
CREATE TABLE "AllTypesWithQuote"
(
    "id"            INT,
    "Bool_col"      BOOLEAN,
    "Tinyint_col"   SMALLINT,
    "Smallint_col"  SMALLINT,
    "Int_col"       INT,
    "Bigint_col"    BIGINT,
    "Float_col"     FLOAT,
    "Double_col"    DOUBLE PRECISION,
    "Date_string_col" VARCHAR(8),
    "String_col"    VARCHAR(10),
    "Timestamp_col" TIMESTAMP
);
__EOT__
sudo -u postgres psql -U hiveuser -d functional -f /tmp/jdbc_alltypes_with_quote.sql

# Load data to jdbc table
cat ${IMPALA_HOME}/testdata/target/AllTypes/* > /tmp/jdbc_alltypes.csv
loadCmd="COPY alltypes FROM '/tmp/jdbc_alltypes.csv' DELIMITER ',' CSV"
sudo -u postgres psql -d functional -c "$loadCmd"

loadCmd="COPY \"AllTypesWithQuote\" FROM '/tmp/jdbc_alltypes.csv' DELIMITER ',' CSV"
sudo -u postgres psql -d functional -c "$loadCmd"

# Clean tmp files
rm /tmp/jdbc_alltypes.*
rm /tmp/jdbc_alltypes_with_quote.*
