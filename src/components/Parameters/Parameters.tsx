import * as React from 'react';
import { DropdownOrLabel } from '../DropdownOrLabel/DropdownOrLabel';
import { ParametersGroup } from './ParametersGroup';

import { UnderlinedHeader } from '../../common-elements';

import { MediaContentModel } from '../../services';
import { FieldModel, RequestBodyModel } from '../../services/models';
import { MediaTypesSwitch } from '../MediaTypeSwitch/MediaTypesSwitch';
import { Schema } from '../Schema';

import { Markdown } from '../Markdown/Markdown';
import { ConstraintsView } from '../Fields/FieldContstraints';
import { PROPERTY_SEPARATOR } from '../../constants';

function safePush(obj, prop, item) {
  if (!obj[prop]) {
    obj[prop] = [];
  }
  obj[prop].push(item);
}

export interface ParametersProps {
  parameters?: FieldModel[];
  operationHash?: string;
  body?: RequestBodyModel;
}

const PARAM_PLACES = ['path', 'query', 'cookie', 'header'];

export class Parameters extends React.PureComponent<ParametersProps> {
  orderParams(params: FieldModel[]): Record<string, FieldModel[]> {
    const res = {};
    params.forEach(param => {
      safePush(res, param.in, param);
    });
    return res;
  }

  render() {
    const { body, parameters = [], operationHash } = this.props;
    if (body === undefined && parameters === undefined) {
      return null;
    }

    const paramsMap = this.orderParams(parameters);

    const paramsPlaces = parameters.length > 0 ? PARAM_PLACES : [];

    const bodyContent = body && body.content;

    const bodyDescription = body && body.description;

    return (
      <>
        {paramsPlaces.map(place => (
          <ParametersGroup
            key={place}
            place={place}
            parameters={paramsMap[place]}
            operationHash={`${operationHash}${PROPERTY_SEPARATOR}${place}`}
          />
        ))}
        {bodyContent && (
          <BodyContent
            content={bodyContent}
            description={bodyDescription}
            operationHash={`${operationHash}${PROPERTY_SEPARATOR}body`}
          />
        )}
      </>
    );
  }
}

function DropdownWithinHeader(props) {
  return (
    <UnderlinedHeader key="header">
      Request Body schema: <DropdownOrLabel {...props} />
    </UnderlinedHeader>
  );
}

export function BodyContent(props: {
  content: MediaContentModel;
  description?: string;
  operationHash?: string;
}): JSX.Element {
  const { content, description, operationHash } = props;
  const { isRequestType } = content;
  return (
    <MediaTypesSwitch content={content} renderDropdown={DropdownWithinHeader}>
      {({ schema }) => {
        return (
          <>
            {description !== undefined && <Markdown source={description} />}
            {schema?.type === 'object' && (
              <ConstraintsView constraints={schema?.constraints || []} />
            )}
            <Schema
              skipReadOnly={isRequestType}
              skipWriteOnly={!isRequestType}
              key="schema"
              schema={schema}
              operationHash={operationHash}
            />
          </>
        );
      }}
    </MediaTypesSwitch>
  );
}
