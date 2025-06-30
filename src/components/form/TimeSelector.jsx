import { Field } from 'formik';
import { useMemo } from 'react';
import { getAvailableTimeSlots } from '../../helpers/time';

const TimeSelector = ({ selectedHora, handleChange, setFieldValue }) => {
  const availableTimeSlots = useMemo(getAvailableTimeSlots, []);

  return (
    <Field
      as="select"
      name="hora"
      className={`custom-select text-xs font-light ${
        selectedHora === '' ? 'text-gray-400' : 'text-black'
      }`}
      value={selectedHora}
      onChange={(e) => {
        handleChange(e);
        setFieldValue('hora', e.target.value);
      }}
    >
      <option value="" disabled>
        ¿Quieres reservar para más tarde?
      </option>
      {availableTimeSlots.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </Field>
  );
};

export default TimeSelector;
