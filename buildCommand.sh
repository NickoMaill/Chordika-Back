# ------- constant part
PURPLE='\033[0;35m';
GREEN='\033[0;32m';
BIG='\033[1m';
NC='\033[00m'; # --> no transformation

echo "${PURPLE}${BIG}BUILD IS STARTING ...${NC}"

i=1
sp="/|\\-/|\\-"
while true
do
printf "\b${sp:i++%${#sp}:1}"
done & 
webpack --mode production 
resolve-tspaths
kill $!; trap 'kill $!' SIGTERM

echo "\n${GREEN}${BIG}SUCCESSFULL BUILDED AND READY FOR DEPLOY${NC}\n"