import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Palette, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  deriveCustomTheme,
  getWhiteContrastRatio,
  isReadableWithWhiteText,
  isValidHexColor,
  THEME_PRESETS,
  ThemePresetKey,
} from '../theme/presets';

export function ThemeSettingsPage() {
  const { activeTheme, customPrimaryColor, previewTheme, resetPreview, saveTheme } = useTheme();
  const { showToast } = useToast();

  const [selectedTheme, setSelectedTheme] = useState<ThemePresetKey>(activeTheme);
  const [customHex, setCustomHex] = useState<string>(customPrimaryColor || '#0F766E');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedTheme(activeTheme);
    if (customPrimaryColor) {
      setCustomHex(customPrimaryColor);
    }
  }, [activeTheme, customPrimaryColor]);

  useEffect(() => {
    if (selectedTheme === 'custom') {
      if (isValidHexColor(customHex)) {
        previewTheme('custom', customHex.toUpperCase());
      }
    } else {
      previewTheme(selectedTheme, null);
    }
  }, [selectedTheme, customHex, previewTheme]);

  useEffect(() => {
    return () => {
      resetPreview();
    };
  }, [resetPreview]);

  const customValidHex = isValidHexColor(customHex);
  const customContrast = customValidHex ? getWhiteContrastRatio(customHex) : 0;
  const customReadable = customValidHex && isReadableWithWhiteText(customHex);
  const derivedCustom = deriveCustomTheme(customValidHex ? customHex : '#1E3A8A');

  const isDirty =
    selectedTheme !== activeTheme ||
    (selectedTheme === 'custom' &&
      customHex.trim().toUpperCase() !== (customPrimaryColor || '').toUpperCase());

  const canSave =
    !saving &&
    (selectedTheme !== 'custom' || (customValidHex && customReadable));

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveTheme(selectedTheme, selectedTheme === 'custom' ? customHex.toUpperCase() : null);
      showToast('success', 'Theme settings saved and applied across the app');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedTheme(activeTheme);
    setCustomHex(customPrimaryColor || '#0F766E');
    resetPreview();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">Theme Settings</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Customize the primary colour palette used across buttons, navigation, chips, and table rows
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F5F6FA] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-[10px] bg-navy hover:bg-navy-hover text-white text-sm font-medium px-5 py-2.5 shadow-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Theme'}</span>
          </button>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEME_PRESETS.map((preset) => {
          const isSelected = selectedTheme === preset.key;
          const isPersisted = activeTheme === preset.key;

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setSelectedTheme(preset.key)}
              className={`text-left bg-white rounded-2xl p-5 border transition-all shadow-card ${
                isSelected
                  ? 'border-navy ring-2 ring-navy/20'
                  : 'border-[#E5E7EB] hover:border-[#6B7280]/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full border border-[#E5E7EB]"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span className="text-base font-semibold text-[#111827]">{preset.label}</span>
                  {isPersisted && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F7EE] text-[#16A34A]">
                      Active
                    </span>
                  )}
                </div>

                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Swatches */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded border border-[#E5E7EB]"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span>{preset.primary}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded border border-[#E5E7EB]"
                    style={{ backgroundColor: preset.primarySoft }}
                  />
                  <span>Soft</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded border border-[#E5E7EB]"
                    style={{ backgroundColor: preset.rowTint }}
                  />
                  <span>Row tint</span>
                </div>
              </div>

              {/* Mini Preview */}
              <div className="rounded-xl border border-[#E5E7EB] overflow-hidden bg-white">
                <div className="px-3 py-2 flex items-center justify-between border-b border-[#E5E7EB]">
                  <span
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                    style={{ backgroundColor: preset.primarySoft, color: preset.primary }}
                  >
                    User Chip
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-[8px] text-[11px] font-medium text-white"
                    style={{ backgroundColor: preset.primary }}
                  >
                    Primary Button
                  </span>
                </div>
                <div
                  className="px-3 py-2 text-[11px] text-[#374151] flex items-center justify-between"
                  style={{ backgroundColor: preset.rowTint }}
                >
                  <span>#U0001 &bull; System Admin</span>
                  <span className="text-[#16A34A] font-medium">Active</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Colour Card */}
      <section
        className={`bg-white rounded-2xl p-6 border transition-all shadow-card ${
          selectedTheme === 'custom' ? 'border-navy ring-2 ring-navy/20' : 'border-[#E5E7EB]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-icon-chip text-navy flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#111827]">Custom Colour</h2>
                {activeTheme === 'custom' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F7EE] text-[#16A34A]">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                Pick one primary colour; soft chips (90% white) and row tints (96% white) are generated automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTheme('custom')}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-medium border transition-colors self-start sm:self-auto ${
              selectedTheme === 'custom'
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F5F6FA]'
            }`}
          >
            {selectedTheme === 'custom' ? 'Selected' : 'Use Custom'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor="custom-color-picker" className="sr-only">
                Pick custom primary colour
              </label>
              <input
                id="custom-color-picker"
                type="color"
                value={customValidHex ? customHex : '#1E3A8A'}
                onChange={(e) => {
                  setSelectedTheme('custom');
                  setCustomHex(e.target.value.toUpperCase());
                }}
                className="w-12 h-11 rounded-lg border border-[#E5E7EB] cursor-pointer p-1 bg-white"
              />
              <div className="flex-1">
                <label htmlFor="custom-hex-input" className="block text-xs font-medium text-[#374151] mb-1">
                  Hex Colour Code
                </label>
                <input
                  id="custom-hex-input"
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    setSelectedTheme('custom');
                    setCustomHex(e.target.value);
                  }}
                  placeholder="#0F766E"
                  maxLength={7}
                  className="w-full rounded-[10px] border border-[#E5E7EB] px-3.5 py-2 text-sm text-[#111827] font-mono focus:outline-none focus:border-navy"
                />
              </div>
            </div>

            {!customValidHex && (
              <p className="text-xs text-[#DC2626]">
                Please enter a valid 6-digit hex colour (e.g. #0F766E).
              </p>
            )}

            {customValidHex && !customReadable && (
              <div
                role="alert"
                className="rounded-xl border border-[#F59E0B]/40 bg-[#FFF4E5] px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-[#374151]"
              >
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span>
                  This colour is too light for white button text (contrast ratio{' '}
                  <strong>{customContrast.toFixed(2)}:1</strong>; minimum required is 4.5:1). Please pick a darker colour to save.
                </span>
              </div>
            )}

            {customValidHex && customReadable && (
              <p className="text-xs text-[#16A34A]">
                Readable white text contrast: <strong>{customContrast.toFixed(2)}:1</strong> (WCAG AA pass)
              </p>
            )}
          </div>

          {/* Derived Swatches + Mini Preview */}
          <div className="rounded-xl border border-[#E5E7EB] overflow-hidden bg-white">
            <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded border border-[#E5E7EB]"
                    style={{ backgroundColor: derivedCustom.primary }}
                  />
                  Primary
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded border border-[#E5E7EB]"
                    style={{ backgroundColor: derivedCustom.primarySoft }}
                  />
                  Soft ({derivedCustom.primarySoft})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded border border-[#E5E7EB]"
                    style={{ backgroundColor: derivedCustom.rowTint }}
                  />
                  Tint ({derivedCustom.rowTint})
                </span>
              </div>
              <span
                className="px-2.5 py-1 rounded-[8px] text-[11px] font-medium text-white"
                style={{ backgroundColor: derivedCustom.primary }}
              >
                Button Preview
              </span>
            </div>
            <div
              className="px-4 py-2.5 text-xs text-[#374151] flex items-center justify-between"
              style={{ backgroundColor: derivedCustom.rowTint }}
            >
              <span>#U0001 &bull; Alternating Table Row</span>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: derivedCustom.primarySoft, color: derivedCustom.primary }}
              >
                Badge
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
