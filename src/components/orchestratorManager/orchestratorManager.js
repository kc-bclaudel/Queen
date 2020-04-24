import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Preloader from 'components/shared/preloader';
import * as lunatic from '@inseefr/lunatic';
import Error from 'components/shared/Error';
import { initialize } from 'utils/initializeOrchestrator';
import surveyUnitIdbService from 'utils/indexedbb/services/surveyUnit-idb-service';
import { AUTHENTICATION_MODE_ENUM, READ_ONLY } from 'utils/constants';
import D from 'i18n';
import * as UQ from 'utils/questionnaire';
import { sendCloseEvent, sendCompletedEvent } from 'utils/communication';
import * as api from 'utils/api';
import Orchestrator from '../orchestrator';
import NotFound from '../shared/not-found';

const OrchestratorManager = ({ match, configuration }) => {
  const [init, setInit] = useState(false);

  const [questionnaire, setQuestionnaire] = useState(undefined);
  const [dataSU, setDataSU] = useState(undefined);

  const [surveyUnit, setSurveyUnit] = useState(undefined);

  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(false);

  const [waitingMessage, setWaitingMessage] = useState(undefined);
  const [errorMessage, setErrorMessage] = useState(undefined);
  const [readonly, setReadonly] = useState(false);

  useEffect(() => {
    if (!init) {
      if ([READ_ONLY, undefined].includes(match.params.readonly)) {
        setReadonly(match.params.readonly === READ_ONLY);
        setWaiting(true);
        const initOrchestrator = async () => {
          try {
            const initialization = initialize(
              configuration,
              match.params.idQ,
              match.params.idSU,
              setWaitingMessage,
              setQuestionnaire,
              setSurveyUnit
            );
            await initialization();
          } catch (e) {
            setError(true);
            setErrorMessage(e.message);
            setWaiting(false);
            setInit(true);
          }
        };
        initOrchestrator();
      }
    }
  }, [init]);

  /**
   * Build special questionnaire for Queen
   * Build special data of survey-unit for Queen
   */
  useEffect(() => {
    if (!init && questionnaire && surveyUnit) {
      const { data, ...other } = surveyUnit;
      setSurveyUnit(other);
      const newDataSU = UQ.buildSpecialQueenData(data);
      const newQuestionnaire = lunatic.mergeQuestionnaireAndData(questionnaire)(newDataSU.data);
      newQuestionnaire.components = UQ.buildQueenQuestionnaire(newQuestionnaire.components);
      setQuestionnaire(newQuestionnaire);
      setDataSU(newDataSU);

      setWaiting(false);
      setInit(true);
    }
  }, [questionnaire, surveyUnit]);

  const putSurveyUnit = async unit => {
    try {
      const token = null;
      await api.putDataSurveyUnitById(configuration.urlQueenApi, token)(unit.id, unit.data);
      await api.putCommentSurveyUnitById(configuration.urlQueenApi, token)(unit.id, unit.comment);
    } catch (e) {
      setError(true);
      setErrorMessage(`${D.putSurveyUnitFailed} : ${e.message}`);
    }
  };

  const saveSU = async unit => {
    await surveyUnitIdbService.addOrUpdateSU(unit);
    if (configuration.standalone) {
      await putSurveyUnit(unit);
    }
  };

  const closeOrchestrator = () => {
    if (configuration.standalone) {
      alert(D.closeWindow);
    } else {
      sendCloseEvent(surveyUnit.id);
    }
  };

  return (
    <>
      {![READ_ONLY, undefined].includes(match.params.readonly) && <NotFound />}
      {waiting && <Preloader message={waitingMessage} />}
      {error && <Error message={errorMessage} />}
      {!waiting && !error && questionnaire && surveyUnit && (
        <Orchestrator
          surveyUnit={surveyUnit}
          source={questionnaire}
          dataSU={dataSU}
          standalone={configuration.standalone}
          readonly={readonly}
          savingType="COLLECTED"
          preferences={['COLLECTED']}
          filterDescription={false}
          save={saveSU}
          close={closeOrchestrator}
        />
      )}
    </>
  );
};

OrchestratorManager.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      readonly: PropTypes.node,
      idQ: PropTypes.node,
      idSU: PropTypes.node,
    }),
  }).isRequired,
  configuration: PropTypes.shape({
    standalone: PropTypes.bool.isRequired,
    urlQueen: PropTypes.string.isRequired,
    urlQueenApi: PropTypes.string.isRequired,
    authenticationMode: PropTypes.oneOf(AUTHENTICATION_MODE_ENUM).isRequired,
  }).isRequired,
};

export default OrchestratorManager;
