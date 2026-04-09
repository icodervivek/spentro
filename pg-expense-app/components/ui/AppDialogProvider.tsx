import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Shadows } from '../../constants/Colors';

type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

type DialogConfig = {
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type AppDialogContextType = {
  alert: (title: string, message?: string, buttons?: DialogButton[]) => void;
  confirm: (options: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
};

const AppDialogContext = createContext<AppDialogContextType | null>(null);

const defaultButtons: DialogButton[] = [{ text: 'OK', style: 'default' }];

export const AppDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const closeDialog = useCallback(() => {
    setDialog(null);
    setResolver(null);
  }, []);

  const alert = useCallback((title: string, message?: string, buttons?: DialogButton[]) => {
    setResolver(null);
    setDialog({
      title,
      message,
      buttons: buttons && buttons.length ? buttons : defaultButtons,
    });
  }, []);

  const confirm: AppDialogContextType['confirm'] = useCallback(
    ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', destructive = false }) =>
      new Promise<boolean>((resolve) => {
        setResolver(() => resolve);
        setDialog({
          title,
          message,
          buttons: [
            { text: cancelText, style: 'cancel' },
            { text: confirmText, style: destructive ? 'destructive' : 'default' },
          ],
        });
      }),
    []
  );

  const handleButtonPress = useCallback(
    async (btn: DialogButton, index: number) => {
      try {
        if (resolver) {
          if (btn.style === 'cancel') resolver(false);
          else resolver(index === 1);
        }
        await btn.onPress?.();
      } finally {
        closeDialog();
      }
    },
    [closeDialog, resolver]
  );

  const contextValue = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <AppDialogContext.Provider value={contextValue}>
      {children}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={closeDialog}>
        <Pressable style={styles.backdrop} onPress={closeDialog}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{dialog?.title}</Text>
            {!!dialog?.message && <Text style={styles.message}>{dialog.message}</Text>}
            <View style={styles.actions}>
              {dialog?.buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={`${btn.text}-${idx}`}
                  activeOpacity={0.86}
                  onPress={() => handleButtonPress(btn, idx)}
                  style={[
                    styles.button,
                    btn.style === 'cancel' && styles.buttonCancel,
                    btn.style === 'destructive' && styles.buttonDanger,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      btn.style === 'cancel' && styles.buttonTextCancel,
                      btn.style === 'destructive' && styles.buttonTextDanger,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error('useAppDialog must be used within AppDialogProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,12,18,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    padding: 18,
    ...Shadows.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    minWidth: 92,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.bgSecondary,
  },
  buttonDanger: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextCancel: {
    color: Colors.textSecondary,
  },
  buttonTextDanger: {
    color: '#FFFFFF',
  },
});
