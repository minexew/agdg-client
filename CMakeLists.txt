cmake_minimum_required(VERSION 2.8.4)
project(agdgclient)

add_custom_target(agdgclient ALL
        COMMAND make -C ${PROJECT_SOURCE_DIR})
