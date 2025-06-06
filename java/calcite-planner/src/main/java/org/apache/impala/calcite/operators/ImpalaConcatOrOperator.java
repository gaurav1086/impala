// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.impala.calcite.operators;

import com.google.common.base.Preconditions;
import org.apache.calcite.rel.type.RelDataType;
import org.apache.calcite.sql.SqlBinaryOperator;
import org.apache.calcite.sql.SqlCallBinding;
import org.apache.calcite.sql.SqlFunction;
import org.apache.calcite.sql.SqlFunctionCategory;
import org.apache.calcite.sql.SqlKind;
import org.apache.calcite.sql.SqlOperandCountRange;
import org.apache.calcite.sql.SqlOperator;
import org.apache.calcite.sql.SqlOperatorBinding;
import org.apache.calcite.sql.SqlSyntax;
import org.apache.calcite.sql.type.SqlOperandCountRanges;
import org.apache.calcite.sql.type.SqlOperandTypeChecker;
import org.apache.calcite.sql.type.SqlTypeName;
import org.apache.impala.calcite.type.ImpalaTypeConverter;
import org.apache.impala.catalog.Function;
import org.apache.impala.catalog.Type;

import java.util.List;

/**
 * Operator used for overloaded || which is used for both "or" and "concat".
 * When both arguments are boolean, we assume it's an "or".  This logic can be
 * found in CompoundVerticalBarExpr.
 */
public class ImpalaConcatOrOperator extends SqlBinaryOperator {
  public static ImpalaConcatOrOperator INSTANCE = new ImpalaConcatOrOperator();

  public ImpalaConcatOrOperator() {
    // use 22 for precedence value which is the same as SqlStdOperatorTable.OR
    super("||", SqlKind.OTHER, 22, true, null, null, null);
  }

  @Override
  public RelDataType inferReturnType(SqlOperatorBinding opBinding) {
    final List<RelDataType> operandTypes =
        CommonOperatorFunctions.getOperandTypes(opBinding);
    Preconditions.checkState(operandTypes.size() == 2);
    if (isOrOperand(opBinding, operandTypes.get(0), 0) &&
        isOrOperand(opBinding, operandTypes.get(1), 1)) {
      return ImpalaTypeConverter.getRelDataType(Type.BOOLEAN);
    }
    return ImpalaTypeConverter.getRelDataType(Type.STRING);
  }

  @Override
  public SqlOperandCountRange getOperandCountRange() {
    return SqlOperandCountRanges.of(2);
  }

  @Override
  public boolean checkOperandTypes(SqlCallBinding callBinding, boolean throwOnFailure) {
    // Validation for operand types are done when checking for signature in
    // the inferReturnType method.
    return true;
  }

  private boolean isOrOperand(SqlOperatorBinding opBinding, RelDataType opType,
      int opNum) {
    return opType.getSqlTypeName() == SqlTypeName.BOOLEAN
       || opBinding.isOperandNull(opNum, false);
  }
}
