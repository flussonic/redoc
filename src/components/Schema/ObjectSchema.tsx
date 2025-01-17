import { observer } from 'mobx-react';
import * as React from 'react';

import { SchemaModel } from '../../services/models';

import { PropertiesTable, PropertiesTableCaption } from '../../common-elements/fields-layout';
import { Field } from '../Fields/Field';
import { DiscriminatorDropdown } from './DiscriminatorDropdown';
import { SchemaProps } from './Schema';

import { getLocationHash, mapWithLast } from '../../utils';
import { OptionsContext } from '../OptionsProvider';
import { PROPERTY_SEPARATOR } from '../../constants';

export interface ObjectSchemaProps extends SchemaProps {
  discriminator?: {
    fieldName: string;
    parentSchema: SchemaModel;
  };
  operationHash?: string;
  discriminatorValue: number;
  onChangeDiscriminator(nextDiscriminatorValue: number): void;
}

export const ObjectSchema = observer(
  ({
    schema: { fields = [], title },
    showTitle,
    discriminator,
    skipReadOnly,
    skipWriteOnly,
    level,
    operationHash,
    discriminatorValue,
    onChangeDiscriminator,
  }: ObjectSchemaProps) => {
    const { expandSingleSchemaField, showObjectSchemaExamples, schemaExpansionLevel } =
      React.useContext(OptionsContext);

    const locationHash = getLocationHash();

    const filteredFields = React.useMemo(
      () =>
        skipReadOnly || skipWriteOnly
          ? fields.filter(
              item =>
                !(
                  (skipReadOnly && item.schema.readOnly) ||
                  (skipWriteOnly && item.schema.writeOnly)
                ),
            )
          : fields,
      [skipReadOnly, skipWriteOnly, fields],
    );

    const expandByDefault =
      (expandSingleSchemaField && filteredFields.length === 1) || schemaExpansionLevel >= level!;

    return (
      <PropertiesTable>
        {showTitle && <PropertiesTableCaption>{title}</PropertiesTableCaption>}
        <tbody>
          {mapWithLast(filteredFields, (field, isLast) => {
            const fieldOperationHash = `${operationHash}${PROPERTY_SEPARATOR}${field.name}`;

            const isChildrenChosen =
              operationHash &&
              fieldOperationHash !== locationHash &&
              locationHash.includes(fieldOperationHash);

            return (
              <Field
                key={field.name}
                isLast={isLast}
                field={field}
                expandByDefault={isChildrenChosen || expandByDefault}
                renderDiscriminatorSwitch={
                  discriminator?.fieldName === field.name
                    ? () => (
                        <DiscriminatorDropdown
                          parent={discriminator!.parentSchema}
                          enumValues={field.schema.enum}
                          discriminatorValue={discriminatorValue}
                          onChangeDiscriminator={onChangeDiscriminator}
                        />
                      )
                    : undefined
                }
                className={field.expanded ? 'expanded' : undefined}
                showExamples={showObjectSchemaExamples}
                skipReadOnly={skipReadOnly}
                skipWriteOnly={skipWriteOnly}
                showTitle={showTitle}
                level={level}
                operationHash={operationHash}
              />
            );
          })}
        </tbody>
      </PropertiesTable>
    );
  },
);
