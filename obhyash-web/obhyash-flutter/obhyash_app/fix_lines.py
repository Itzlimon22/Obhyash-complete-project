file_path = 'lib/features/profile/presentation/personal_details_view.dart'

replacements = {
    377: "                        'ব্যক্তিগত তথ্য',\n",
    389: "                                  'তোমার পুরো নাম লেখো',\n",
    392: "                                  ? 'নাম লেখা আবশ্যক!'\n",
    397: "                              label: 'ফোন নম্বর',\n",
    407: "                              label: 'জন্ম তারিখ',\n",
    420: "                                  'ছাত্র/ছাত্রী (Gender)',\n",
    433: "                                  'বর্তমান ঠিকানা...',\n",
    450: "                        'একাডেমিক তথ্য',\n",
    462: "                                      'শিক্ষা প্রতিষ্ঠানের নাম',\n",
    466: "                                      'তোমার শিক্ষা প্রতিষ্ঠানের নাম লিখো...',\n",
    538: "                                  'কী নিয়ে চর্চা করতে চাও?',\n",
    566: "                                    label: 'ব্যাচ',\n",
    584: "                              label: 'টার্গেট',\n",
    598: "                                  'এসএসসি রোল নম্বর',\n",
    602: "                                  'রোল নম্বর লেখো',\n",
    607: "                                  'এসএসসি রেজিস্ট্রেশন নম্বর',\n",
    611: "                                  'রেজিস্ট্রেশন নম্বর লেখো',\n",
    618: "                                    label: 'এসএসসি বোর্ড',\n",
    642: "                                        'এসএসসি পাসিং ইয়ার',\n",
    685: "                        'অ্যাকাউন্ট লিংকিং',\n",
    718: "                        'পাসওয়ার্ড পরিবর্তন',\n",
    727: "                              'পরিবর্তন করতে না চাইলে খালি রাখো',\n",
    737: "                              label: 'নতুন পাসওয়ার্ড',\n",
    756: "                                  'পাসওয়ার্ড নিশ্চিত করো',\n"
}

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line_idx, new_line in replacements.items():
    if 'à¦' in lines[line_idx]:
        lines[line_idx] = new_line
    else:
        print(f"Warning: line {line_idx} does not contain garbled text: {lines[line_idx].strip()}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed using line numbers")
