import { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlined from '@mui/icons-material/AddCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { formatDate, todayISO } from '../../utils/dates';

const REQUIRED_MESSAGES = {
  patient: 'Select a patient',
  insurer: 'Select an insurer',
  date: 'Enter the date of service',
  doctors: 'Assign at least one doctor',
  diagnoses: 'Select at least one diagnosis code',
  procedures: 'Select at least one procedure code',
};

const CODE_OPTION_CHIP = {
  flexShrink: 0,
  height: 22,
  bgcolor: 'rgba(100, 116, 139, 0.12)',
  color: '#64748B',
  fontWeight: 600,
  fontSize: 11,
};

function renderCodeOption(props, option) {
  return (
    <Box component="li" {...props}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
        >
          {option.code}
        </Typography>
        <Typography
          sx={{
            fontSize: 13.5,
            color: 'text.primary',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {option.description}
        </Typography>
        <Chip label={option.category} size="small" sx={CODE_OPTION_CHIP} />
      </Stack>
    </Box>
  );
}

const codeOptionLabel = (option) => `${option.code} — ${option.description}`;

export default function ClaimDetailsForm({ lookups, lookupErrors, mode, busy, onSubmit }) {
  const { patients, insurers, diagnosisCodes, procedureCodes, doctors } = lookups;

  const [patient, setPatient] = useState(null);
  const [insurer, setInsurer] = useState(null);
  const [dateOfService, setDateOfService] = useState(todayISO());
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [modifiers, setModifiers] = useState({});
  const [touched, setTouched] = useState({});

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const missing = {
    patient: !patient,
    insurer: !insurer,
    date: !dateOfService,
    doctors: selectedDoctors.length === 0,
    diagnoses: diagnoses.length === 0,
    procedures: procedures.length === 0,
  };
  const canSubmit = !Object.values(missing).some(Boolean);
  const fieldError = (name) => (touched[name] && missing[name] ? REQUIRED_MESSAGES[name] : ' ');

  const referenceDataFailed = ['patients', 'insurers', 'diagnosisCodes', 'procedureCodes'].some(
    (key) => lookupErrors[key]
  );

  const isRecheck = mode === 'recheck';

  const handleSubmit = () => {
    setTouched({
      patient: true,
      insurer: true,
      date: true,
      doctors: true,
      diagnoses: true,
      procedures: true,
    });
    if (!canSubmit) return;

    onSubmit({
      patientId: patient.id,
      insurerId: insurer.id,
      dateOfService,
      doctorIds: selectedDoctors.map((doctor) => doctor.id),
      diagnosisCodeIds: diagnoses.map((item) => item.id),
      procedureCodes: procedures.map((item) => ({
        procedureCodeId: item.id,
        modifier: (modifiers[item.id] ?? '').trim() || null,
      })),
    });
  };

  const removeDiagnosis = (item) => {
    setDiagnoses((prev) => prev.filter((d) => d.id !== item.id));
    markTouched('diagnoses');
  };

  const removeProcedure = (item) => {
    setProcedures((prev) => prev.filter((p) => p.id !== item.id));
    markTouched('procedures');
  };

  return (
    <Card sx={{ p: { xs: 2.5, sm: 4 } }}>
      {referenceDataFailed && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Some reference data couldn't be loaded. Please refresh the page and try again.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Autocomplete
            fullWidth
            options={patients}
            value={patient}
            onChange={(_event, value) => {
              setPatient(value);
              markTouched('patient');
            }}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Patient"
                required
                placeholder="Search by name"
                error={Boolean(touched.patient && missing.patient)}
                helperText={fieldError('patient')}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                    {formatDate(option.dateOfBirth)}
                    {option.gender ? ` · ${option.gender}` : ''}
                  </Typography>
                </Box>
              </Box>
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            fullWidth
            options={insurers}
            value={insurer}
            onChange={(_event, value) => {
              setInsurer(value);
              markTouched('insurer');
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Insurer"
                required
                placeholder="Select insurer"
                error={Boolean(touched.insurer && missing.insurer)}
                helperText={fieldError('insurer')}
              />
            )}
          />
          {insurer?.rulesNotes && (
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                p: 1.5,
                borderRadius: 1,
                bgcolor: '#FEFCE8',
                border: '1px solid #FDE68A',
                borderLeft: '4px solid #CA8A04',
              }}
            >
              <WarningAmberOutlined sx={{ fontSize: 18, color: '#CA8A04', mt: 0.25, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#854D0E',
                  }}
                >
                  Insurer note
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#854D0E' }}>{insurer.rulesNotes}</Typography>
              </Box>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Date of Service"
            type="date"
            required
            fullWidth
            value={dateOfService}
            onChange={(event) => {
              setDateOfService(event.target.value);
              markTouched('date');
            }}
            InputLabelProps={{ shrink: true }}
            error={Boolean(touched.date && missing.date)}
            helperText={fieldError('date')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            fullWidth
            multiple
            options={doctors}
            value={selectedDoctors}
            onChange={(_event, value) => {
              setSelectedDoctors(value);
              markTouched('doctors');
            }}
            getOptionLabel={(option) => option.username}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Doctors"
                required
                placeholder="Search by username"
                error={Boolean(touched.doctors && missing.doctors)}
                helperText={fieldError('doctors')}
              />
            )}
          />
          {lookupErrors.doctors && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              Doctors couldn't be loaded — please contact your administrator.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            fullWidth
            multiple
            options={diagnosisCodes}
            value={diagnoses}
            onChange={(_event, value) => {
              setDiagnoses(value);
              markTouched('diagnoses');
            }}
            getOptionLabel={codeOptionLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Diagnosis Codes"
                required
                placeholder="Search by code or description"
                error={Boolean(touched.diagnoses && missing.diagnoses)}
                helperText={fieldError('diagnoses')}
              />
            )}
            renderOption={renderCodeOption}
          />
          {diagnoses.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {diagnoses.map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.code} — ${item.description}`}
                  onDelete={() => removeDiagnosis(item)}
                  sx={{
                    maxWidth: 420,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            fullWidth
            multiple
            options={procedureCodes}
            value={procedures}
            onChange={(_event, value) => {
              setProcedures(value);
              markTouched('procedures');
            }}
            getOptionLabel={codeOptionLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={() => null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Procedure Codes"
                required
                placeholder="Search by code or description"
                error={Boolean(touched.procedures && missing.procedures)}
                helperText={fieldError('procedures')}
              />
            )}
            renderOption={renderCodeOption}
          />
          {procedures.length > 0 && (
            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
              {procedures.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.default',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => removeProcedure(item)}
                    aria-label={`Remove ${item.code}`}
                  >
                    <CloseOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {item.code}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
                      {item.description}
                    </Typography>
                  </Box>
                  <TextField
                    label="Modifier"
                    size="small"
                    value={modifiers[item.id] ?? ''}
                    onChange={(event) =>
                      setModifiers((prev) => ({ ...prev, [item.id]: event.target.value }))
                    }
                    placeholder="e.g. 25"
                    sx={{ width: 140 }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isRecheck ? <FactCheckOutlined /> : <AddCircleOutlined />}
          disabled={!canSubmit || busy}
          onClick={handleSubmit}
          sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}
        >
          {busy ? (
            <CircularProgress size={20} color="inherit" />
          ) : isRecheck ? (
            'Re-check'
          ) : (
            'Create Claim'
          )}
        </Button>
      </Box>
    </Card>
  );
}
