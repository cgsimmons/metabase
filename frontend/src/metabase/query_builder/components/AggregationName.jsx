/* @flow */

import React from "react";

import _ from "underscore";
import { t } from "c-3po";

import Query, { AggregationClause, NamedClause } from "metabase/lib/query";
import { getAggregator } from "metabase/lib/schema_metadata";
import { format } from "metabase/lib/expressions/formatter";

import FieldName from "./FieldName";

import type { Aggregation } from "metabase/meta/types/Query";
import StructuredQuery from "metabase-lib/lib/queries/StructuredQuery";

type Props = {
  aggregation: Aggregation,
  query: StructuredQuery,
  className?: string,
};

const AggregationName = ({ aggregation, query, className }: Props) => {
  const tableMetadata = query.tableMetadata();
  const customFields = query.expressions();
  if (!tableMetadata) {
    return null;
  }
  return NamedClause.isNamed(aggregation) ? (
    <NamedAggregation aggregation={aggregation} className={className} />
  ) : AggregationClause.isCustom(aggregation) ? (
    <CustomAggregation
      aggregation={aggregation}
      tableMetadata={tableMetadata}
      customFields={customFields}
      className={className}
    />
  ) : AggregationClause.isMetric(aggregation) ? (
    <MetricAggregation
      aggregation={aggregation}
      tableMetadata={tableMetadata}
      className={className}
    />
  ) : (
    <StandardAggregation
      aggregation={aggregation}
      tableMetadata={tableMetadata}
      customFields={customFields}
      className={className}
    />
  );
};

const NamedAggregation = ({ aggregation, className }) => (
  <span className={className}>{NamedClause.getName(aggregation)}</span>
);

const CustomAggregation = ({
  aggregation,
  tableMetadata,
  customFields,
  className,
}) => (
  <span className={className}>
    {format(aggregation, { tableMetadata, customFields })}
  </span>
);

const MetricAggregation = ({ aggregation, tableMetadata, className }) => {
  const metricId = AggregationClause.getMetric(aggregation);
  const selectedMetric = _.findWhere(tableMetadata.metrics, { id: metricId });
  if (selectedMetric) {
    return (
      <span className={className}>
        {selectedMetric.name.replace(" of ...", "")}
      </span>
    );
  } else {
    return <span className={className}>{t`Invalid`}</span>;
  }
};

const StandardAggregation = ({
  aggregation,
  tableMetadata,
  customFields,
  className,
}) => {
  const fieldId = AggregationClause.getField(aggregation);

  let selectedAggregation = getAggregator(
    AggregationClause.getOperator(aggregation),
  );
  // if this table doesn't support the selected aggregation, prompt the user to select a different one
  if (
    selectedAggregation &&
    _.findWhere(tableMetadata.aggregation_options, {
      short: selectedAggregation.short,
    })
  ) {
    return (
      <span className={className}>
        {selectedAggregation.name.replace(" of ...", "")}
        {fieldId && <span className="text-bold"> {t`of`} </span>}
        {fieldId && (
          <FieldName
            field={fieldId}
            tableMetadata={tableMetadata}
            fieldOptions={Query.getFieldOptions(tableMetadata.fields, true)}
            customFieldOptions={customFields}
          />
        )}
      </span>
    );
  } else {
    return <span>{t`Invalid`}</span>;
  }
};

export default AggregationName;