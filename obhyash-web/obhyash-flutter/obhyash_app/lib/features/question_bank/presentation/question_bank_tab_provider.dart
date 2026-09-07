import 'package:flutter_riverpod/flutter_riverpod.dart';

enum QuestionBankTab { institution, subject }

class QuestionBankTabNotifier extends Notifier<QuestionBankTab> {
  @override
  QuestionBankTab build() => QuestionBankTab.institution;

  void setTab(QuestionBankTab tab) => state = tab;
}

final questionBankTabProvider =
    NotifierProvider<QuestionBankTabNotifier, QuestionBankTab>(
      QuestionBankTabNotifier.new,
    );
